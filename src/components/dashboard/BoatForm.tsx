import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

interface BoatFormProps {
  owner: Tables<'owners'> | null;
}

const boatTypes = [
  { value: 'leisure_boat', label: 'Barco de Passeio' },
  { value: 'jet_ski', label: 'Jet Ski' },
  { value: 'yacht', label: 'Iate' },
  { value: 'sailboat', label: 'Veleiro' },
  { value: 'speedboat', label: 'Lancha' },
  { value: 'fishing_boat', label: 'Barco de Pesca' },
  { value: 'pontoon', label: 'Pontão' },
  { value: 'catamaran', label: 'Catamarã' },
];

export function BoatForm({ owner }: BoatFormProps) {
  const navigate = useNavigate();
  const { boatId } = useParams();
  const isEditing = !!boatId;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'leisure_boat' as Tables<'boats'>['type'],
    description: '',
    capacity: 1,
    length_meters: '',
    base_price: '',
    deposit_amount: '',
    has_crew: true,
    crew_included: true,
    rules: '',
    is_active: true,
  });

  const { data: existingBoat } = useQuery({
    queryKey: ['boat', boatId],
    queryFn: async () => {
      if (!boatId) return null;
      const { data, error } = await supabase
        .from('boats')
        .select('*')
        .eq('id', boatId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingBoat) {
      setFormData({
        name: existingBoat.name,
        type: existingBoat.type,
        description: existingBoat.description || '',
        capacity: existingBoat.capacity,
        length_meters: existingBoat.length_meters?.toString() || '',
        base_price: existingBoat.base_price.toString(),
        deposit_amount: existingBoat.deposit_amount?.toString() || '',
        has_crew: existingBoat.has_crew ?? true,
        crew_included: existingBoat.crew_included ?? true,
        rules: existingBoat.rules || '',
        is_active: existingBoat.is_active ?? true,
      });
    }
  }, [existingBoat]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!owner) return;

    setLoading(true);

    try {
      const boatData = {
        owner_id: owner.id,
        name: formData.name,
        type: formData.type,
        description: formData.description || null,
        capacity: formData.capacity,
        length_meters: formData.length_meters ? parseFloat(formData.length_meters) : null,
        base_price: parseFloat(formData.base_price),
        deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : 0,
        has_crew: formData.has_crew,
        crew_included: formData.crew_included,
        rules: formData.rules || null,
        is_active: formData.is_active,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('boats')
          .update(boatData)
          .eq('id', boatId);
        if (error) throw error;
        toast.success('Embarcação atualizada com sucesso!');
      } else {
        const { error } = await supabase.from('boats').insert(boatData);
        if (error) throw error;
        toast.success('Embarcação cadastrada com sucesso!');
      }

      navigate('/dashboard/embarcacoes');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar embarcação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Editar Embarcação' : 'Nova Embarcação'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Atualize os dados da embarcação' : 'Cadastre uma nova embarcação'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="glass-card border-border/30">
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Embarcação *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Lancha Azul"
                  required
                  className="bg-input border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as Tables<'boats'>['type'] })
                  }
                >
                  <SelectTrigger className="bg-input border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {boatTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidade (pessoas) *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })
                  }
                  required
                  className="bg-input border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="length">Comprimento (metros)</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  value={formData.length_meters}
                  onChange={(e) =>
                    setFormData({ ...formData, length_meters: e.target.value })
                  }
                  placeholder="Ex: 12.5"
                  className="bg-input border-border/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva a embarcação, comodidades, etc."
                rows={4}
                className="bg-input border-border/50"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/30 mt-4">
          <CardHeader>
            <CardTitle>Preços e Condições</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_price">Preço Base (R$/dia) *</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  placeholder="Ex: 1500.00"
                  required
                  className="bg-input border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit">Valor do Sinal (R$)</Label>
                <Input
                  id="deposit"
                  type="number"
                  step="0.01"
                  value={formData.deposit_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, deposit_amount: e.target.value })
                  }
                  placeholder="Ex: 500.00"
                  className="bg-input border-border/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Possui Tripulação</Label>
                <p className="text-sm text-muted-foreground">
                  A embarcação opera com tripulação
                </p>
              </div>
              <Switch
                checked={formData.has_crew}
                onCheckedChange={(checked) => setFormData({ ...formData, has_crew: checked })}
              />
            </div>

            {formData.has_crew && (
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>Tripulação Inclusa no Preço</Label>
                  <p className="text-sm text-muted-foreground">
                    O custo da tripulação está incluído
                  </p>
                </div>
                <Switch
                  checked={formData.crew_included}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, crew_included: checked })
                  }
                />
              </div>
            )}

            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Embarcação Ativa</Label>
                <p className="text-sm text-muted-foreground">
                  Visível para clientes na plataforma
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rules">Regras e Condições</Label>
              <Textarea
                id="rules"
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                placeholder="Ex: Proibido fumar, não permitido animais, etc."
                rows={3}
                className="bg-input border-border/50"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="gradient-button">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Atualizar' : 'Cadastrar'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
