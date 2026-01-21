import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Users, Ship, Check, X, Loader2, Clock } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

interface BookingsManagementProps {
  owner: Tables<'owners'> | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning border-warning/30',
  confirmed: 'bg-primary/20 text-primary border-primary/30',
  in_progress: 'bg-accent/20 text-accent border-accent/30',
  completed: 'bg-success/20 text-success border-success/30',
  cancelled: 'bg-destructive/20 text-destructive border-destructive/30',
  refunded: 'bg-muted text-muted-foreground border-muted',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmada',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  refunded: 'Reembolsada',
};

export function BookingsManagement({ owner }: BookingsManagementProps) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['owner-bookings', owner?.id, statusFilter],
    queryFn: async () => {
      if (!owner) return [];

      // First get owner's boats
      const { data: boats } = await supabase
        .from('boats')
        .select('id')
        .eq('owner_id', owner.id);

      if (!boats || boats.length === 0) return [];

      const boatIds = boats.map((b) => b.id);

      let query = supabase
        .from('bookings')
        .select(`
          *,
          boats(name, type)
        `)
        .in('boat_id', boatIds)
        .order('booking_date', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data } = await query;
      return data || [];
    },
    enabled: !!owner,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: Tables<'bookings'>['status'];
    }) => {
      const updateData: Record<string, unknown> = { status };
      
      if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      } else if (status === 'in_progress') {
        updateData.check_in_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.check_out_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status atualizado!');
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar status');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reservas</h1>
          <p className="text-muted-foreground">Gerencie as reservas recebidas</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 bg-input border-border/50">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="confirmed">Confirmadas</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="completed">Concluídas</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="glass-card border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Lista de Reservas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : bookings && bookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Embarcação</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Passageiros</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Ship className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {(booking.boats as any)?.name || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(booking.booking_date), "dd 'de' MMMM", {
                        locale: ptBR,
                      })}
                      {booking.start_time && (
                        <span className="text-muted-foreground ml-1">
                          às {booking.start_time.slice(0, 5)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {booking.passengers}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(Number(booking.total_price))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[booking.status || 'pending']}
                      >
                        {statusLabels[booking.status || 'pending']}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {booking.status === 'pending' && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  bookingId: booking.id,
                                  status: 'confirmed',
                                })
                              }
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  bookingId: booking.id,
                                  status: 'cancelled',
                                })
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                bookingId: booking.id,
                                status: 'in_progress',
                              })
                            }
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            Check-in
                          </Button>
                        )}
                        {booking.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                bookingId: booking.id,
                                status: 'completed',
                              })
                            }
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Concluir
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma reserva encontrada</h3>
              <p className="text-muted-foreground">
                {statusFilter !== 'all'
                  ? 'Não há reservas com este status'
                  : 'Você ainda não recebeu nenhuma reserva'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
