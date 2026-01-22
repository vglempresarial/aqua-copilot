import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, CalendarDays, Ship } from 'lucide-react';
import { toast } from 'sonner';

const BOOKING_ACTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/booking-actions`;

type BookingRow = {
  id: string;
  booking_date: string;
  status: string;
  check_in_at: string | null;
  total_price: number;
  deposit_amount: number;
  boats?: { name: string } | null;
};

export default function Passeios() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data;
    },
  });

  const accessToken = sessionData?.session?.access_token;

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        navigate('/login');
        return [];
      }

      const { data, error } = await supabase
        .from('bookings')
        .select('id, booking_date, status, check_in_at, total_price, deposit_amount, boats(name)')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as BookingRow[];
    },
    enabled: !sessionLoading,
  });

  const canCheckIn = (b: BookingRow) => b.status === 'confirmed' && !b.check_in_at;

  const checkInMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      if (!accessToken) throw new Error('Você precisa estar logado para confirmar o check-in');

      const resp = await fetch(BOOKING_ACTIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ action: 'checkin', bookingId }),
      });

      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json.error || 'Falha ao confirmar check-in');
      return json;
    },
    onSuccess: () => {
      toast.success('Check-in confirmado! Pagamento liberado.');
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (e: any) => {
      toast.error(e.message || 'Erro ao confirmar check-in');
    },
  });

  const emptyState = useMemo(() => {
    if (isLoading) return null;
    if (bookings && bookings.length === 0) {
      return (
        <Card className="glass-card border-border/30">
          <CardContent className="p-8 text-center space-y-2">
            <Ship className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-lg font-semibold">Nenhum passeio ainda</p>
            <p className="text-sm text-muted-foreground">
              Quando você fizer uma reserva, ela vai aparecer aqui.
            </p>
            <div className="pt-2">
              <Button className="gradient-button" onClick={() => navigate('/')}>Buscar embarcações</Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  }, [bookings, isLoading, navigate]);

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6 max-w-4xl">
          <div>
            <h1 className="text-2xl font-bold">Meus Passeios</h1>
            <p className="text-muted-foreground">Acompanhe suas reservas e confirme o check-in.</p>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando reservas...
            </div>
          ) : (
            emptyState
          )}

          {bookings?.map((b) => (
            <Card key={b.id} className="glass-card border-border/30">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-3">
                  <span className="truncate">{b.boats?.name ?? 'Embarcação'}</span>
                  <Badge variant="outline">{statusLabel(b.status)}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {formatDateBR(b.booking_date)}
                  </span>
                  <span>
                    Total: <span className="text-foreground/90 font-medium">{formatBRL(b.total_price)}</span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    className="gradient-button"
                    disabled={!canCheckIn(b) || checkInMutation.isPending}
                    onClick={() => checkInMutation.mutate(b.id)}
                  >
                    {checkInMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Confirmando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Confirmar check-in
                      </>
                    )}
                  </Button>
                  {!canCheckIn(b) && b.check_in_at && (
                    <Badge className="bg-success/20 text-success border border-success/30">
                      Check-in confirmado
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  O check-in é confirmado pelo locatário e libera o pagamento retido (escrow).
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

function statusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'confirmed':
      return 'Confirmada';
    case 'in_progress':
      return 'Em andamento';
    case 'completed':
      return 'Concluída';
    case 'cancelled':
      return 'Cancelada';
    case 'refunded':
      return 'Reembolsada';
    default:
      return status;
  }
}

function formatDateBR(dateIso: string) {
  const [y, m, d] = dateIso.split('-');
  return `${d}/${m}/${y}`;
}

function formatBRL(amount: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}
