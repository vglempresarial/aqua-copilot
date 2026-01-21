import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Loader2 } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AvailabilityManagementProps {
  owner: Tables<'owners'> | null;
}

export function AvailabilityManagement({ owner }: AvailabilityManagementProps) {
  const queryClient = useQueryClient();
  const [selectedBoat, setSelectedBoat] = useState<string>('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

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

  const { data: availability, isLoading } = useQuery({
    queryKey: ['availability', selectedBoat],
    queryFn: async () => {
      if (!selectedBoat) return [];
      const { data } = await supabase
        .from('availability')
        .select('*')
        .eq('boat_id', selectedBoat);
      return data || [];
    },
    enabled: !!selectedBoat,
  });

  const { data: bookings } = useQuery({
    queryKey: ['boat-bookings', selectedBoat],
    queryFn: async () => {
      if (!selectedBoat) return [];
      const { data } = await supabase
        .from('bookings')
        .select('booking_date, status')
        .eq('boat_id', selectedBoat)
        .in('status', ['pending', 'confirmed', 'in_progress']);
      return data || [];
    },
    enabled: !!selectedBoat,
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: async (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const existing = availability?.find((a) => a.date === dateStr);

      if (existing) {
        // Toggle existing
        const { error } = await supabase
          .from('availability')
          .update({ is_available: !existing.is_available })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Create as unavailable
        const { error } = await supabase.from('availability').insert({
          boat_id: selectedBoat,
          date: dateStr,
          is_available: false,
          source: 'manual',
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', selectedBoat] });
      toast.success('Disponibilidade atualizada');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar disponibilidade');
    },
  });

  const getDateStatus = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Check for bookings first
    const hasBooking = bookings?.some((b) => b.booking_date === dateStr);
    if (hasBooking) return 'booked';

    // Check manual availability
    const avail = availability?.find((a) => a.date === dateStr);
    if (avail && !avail.is_available) return 'blocked';

    return 'available';
  };

  const modifiers = {
    booked: (date: Date) => getDateStatus(date) === 'booked',
    blocked: (date: Date) => getDateStatus(date) === 'blocked',
    available: (date: Date) => getDateStatus(date) === 'available',
  };

  const modifiersStyles = {
    booked: {
      backgroundColor: 'hsl(var(--destructive) / 0.3)',
      color: 'hsl(var(--destructive))',
      fontWeight: 'bold',
    },
    blocked: {
      backgroundColor: 'hsl(var(--muted))',
      color: 'hsl(var(--muted-foreground))',
      textDecoration: 'line-through',
    },
    available: {
      backgroundColor: 'hsl(var(--success) / 0.2)',
      color: 'hsl(var(--success))',
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestão de Disponibilidade</h1>
        <p className="text-muted-foreground">
          Gerencie o calendário de suas embarcações
        </p>
      </div>

      {/* Boat Selector */}
      <Card className="glass-card border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="glass-card border-border/30 lg:col-span-2">
            <CardHeader>
              <CardTitle>Calendário</CardTitle>
              <p className="text-sm text-muted-foreground">
                Clique em uma data para alternar a disponibilidade
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={(dates) => setSelectedDates(dates || [])}
                  onDayClick={(date) => {
                    const status = getDateStatus(date);
                    if (status !== 'booked') {
                      toggleAvailabilityMutation.mutate(date);
                    }
                  }}
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  locale={ptBR}
                  numberOfMonths={2}
                  className="w-full"
                  disabled={(date) => date < new Date()}
                />
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="glass-card border-border/30">
            <CardHeader>
              <CardTitle>Legenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-md"
                  style={{ backgroundColor: 'hsl(160 70% 45% / 0.2)' }}
                />
                <div>
                  <p className="font-medium text-success">Disponível</p>
                  <p className="text-sm text-muted-foreground">
                    Aberto para reservas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-md"
                  style={{ backgroundColor: 'hsl(var(--muted))' }}
                />
                <div>
                  <p className="font-medium text-muted-foreground">Bloqueado</p>
                  <p className="text-sm text-muted-foreground">
                    Indisponível manualmente
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-md"
                  style={{ backgroundColor: 'hsl(0 70% 55% / 0.3)' }}
                />
                <div>
                  <p className="font-medium text-destructive">Reservado</p>
                  <p className="text-sm text-muted-foreground">
                    Já possui reserva
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/30">
                <p className="text-sm text-muted-foreground">
                  <strong>Dica:</strong> Clique em qualquer data disponível ou 
                  bloqueada para alternar o status. Datas com reservas não podem
                  ser alteradas.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
