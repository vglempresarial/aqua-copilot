import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, DollarSign, Loader2 } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

interface PricingManagementProps {
  owner: Tables<'owners'> | null;
}

const pricingTypes = [
  { value: 'weekday', label: 'Dia de Semana' },
  { value: 'weekend', label: 'Final de Semana' },
  { value: 'holiday', label: 'Feriado' },
  { value: 'high_season', label: 'Alta Temporada' },
  { value: 'low_season', label: 'Baixa Temporada' },
  { value: 'special', label: 'Especial' },
];

const daysOfWeek = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

export function PricingManagement({ owner }: PricingManagementProps) {
  const queryClient = useQueryClient();
  const [selectedBoat, setSelectedBoat] = useState<string>('');
  const [newRule, setNewRule] = useState({
    pricing_type: 'weekend' as Tables<'dynamic_pricing'>['pricing_type'],
    price_modifier: '1.2',
    day_of_week: '',
    start_date: '',
    end_date: '',
  });

  const { data: boats } = useQuery({
    queryKey: ['owner-boats', owner?.id],
    queryFn: async () => {
      if (!owner) return [];
      const { data } = await supabase
        .from('boats')
        .select('id, name')
        .eq('owner_id', owner.id);
      return data || [];
    },
    enabled: !!owner,
  });

  const { data: pricingRules, isLoading } = useQuery({
    queryKey: ['pricing-rules', selectedBoat],
    queryFn: async () => {
      if (!selectedBoat) return [];
      const { data } = await supabase
        .from('dynamic_pricing')
        .select('*')
        .eq('boat_id', selectedBoat)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!selectedBoat,
  });

  const addRuleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('dynamic_pricing').insert({
        boat_id: selectedBoat,
        pricing_type: newRule.pricing_type,
        price_modifier: parseFloat(newRule.price_modifier),
        day_of_week: newRule.day_of_week ? parseInt(newRule.day_of_week) : null,
        start_date: newRule.start_date || null,
        end_date: newRule.end_date || null,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Regra adicionada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['pricing-rules', selectedBoat] });
      setNewRule({
        pricing_type: 'weekend',
        price_modifier: '1.2',
        day_of_week: '',
        start_date: '',
        end_date: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao adicionar regra');
    },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('dynamic_pricing')
        .update({ is_active: !is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules', selectedBoat] });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dynamic_pricing').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Regra removida');
      queryClient.invalidateQueries({ queryKey: ['pricing-rules', selectedBoat] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Precificação Dinâmica</h1>
        <p className="text-muted-foreground">
          Configure preços diferenciados por período
        </p>
      </div>

      {/* Boat Selector */}
      <Card className="glass-card border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Selecione a Embarcação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedBoat} onValueChange={setSelectedBoat}>
            <SelectTrigger className="w-full md:w-80 bg-input border-border/50">
              <SelectValue placeholder="Escolha uma embarcação" />
            </SelectTrigger>
            <SelectContent>
              {boats?.map((boat) => (
                <SelectItem key={boat.id} value={boat.id}>
                  {boat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedBoat && (
        <>
          {/* Add New Rule */}
          <Card className="glass-card border-border/30">
            <CardHeader>
              <CardTitle>Nova Regra de Preço</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={newRule.pricing_type}
                    onValueChange={(value) =>
                      setNewRule({
                        ...newRule,
                        pricing_type: value as Tables<'dynamic_pricing'>['pricing_type'],
                      })
                    }
                  >
                    <SelectTrigger className="bg-input border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pricingTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Multiplicador</Label>
                  <Input
                    type="number"
                    step="0.05"
                    value={newRule.price_modifier}
                    onChange={(e) =>
                      setNewRule({ ...newRule, price_modifier: e.target.value })
                    }
                    placeholder="Ex: 1.2 = +20%"
                    className="bg-input border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Dia da Semana</Label>
                  <Select
                    value={newRule.day_of_week}
                    onValueChange={(value) =>
                      setNewRule({ ...newRule, day_of_week: value })
                    }
                  >
                    <SelectTrigger className="bg-input border-border/50">
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((day) => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={newRule.start_date}
                    onChange={(e) =>
                      setNewRule({ ...newRule, start_date: e.target.value })
                    }
                    className="bg-input border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={newRule.end_date}
                    onChange={(e) =>
                      setNewRule({ ...newRule, end_date: e.target.value })
                    }
                    className="bg-input border-border/50"
                  />
                </div>
              </div>

              <Button
                onClick={() => addRuleMutation.mutate()}
                disabled={addRuleMutation.isPending}
                className="mt-4 gradient-button"
              >
                {addRuleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Adicionar Regra
              </Button>
            </CardContent>
          </Card>

          {/* Existing Rules */}
          <Card className="glass-card border-border/30">
            <CardHeader>
              <CardTitle>Regras Configuradas</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : pricingRules && pricingRules.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Multiplicador</TableHead>
                      <TableHead>Dia</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-20">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricingRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {pricingTypes.find((t) => t.value === rule.pricing_type)?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">
                          {rule.price_modifier}x
                          <span className="text-muted-foreground text-sm ml-1">
                            ({((Number(rule.price_modifier) - 1) * 100).toFixed(0)}%)
                          </span>
                        </TableCell>
                        <TableCell>
                          {rule.day_of_week !== null
                            ? daysOfWeek.find((d) => d.value === rule.day_of_week)?.label
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {rule.start_date && rule.end_date
                            ? `${new Date(rule.start_date).toLocaleDateString('pt-BR')} - ${new Date(rule.end_date).toLocaleDateString('pt-BR')}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={rule.is_active ?? true}
                            onCheckedChange={() =>
                              toggleRuleMutation.mutate({
                                id: rule.id,
                                is_active: rule.is_active ?? true,
                              })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteRuleMutation.mutate(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhuma regra configurada para esta embarcação
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
