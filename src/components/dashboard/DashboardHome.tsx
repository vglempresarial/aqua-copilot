import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ship, Calendar, DollarSign, Users, TrendingUp, Clock } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

interface DashboardHomeProps {
  owner: Tables<'owners'> | null;
}

export function DashboardHome({ owner }: DashboardHomeProps) {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', owner?.id],
    queryFn: async () => {
      if (!owner) return null;

      const [boatsRes, bookingsRes, pendingRes] = await Promise.all([
        supabase
          .from('boats')
          .select('id', { count: 'exact' })
          .eq('owner_id', owner.id)
          .eq('is_active', true),
        supabase
          .from('bookings')
          .select('id, total_price, status, boat_id')
          .in('status', ['confirmed', 'completed', 'in_progress']),
        supabase
          .from('bookings')
          .select('id')
          .eq('status', 'pending'),
      ]);

      // Filter bookings by owner's boats
      const { data: ownerBoats } = await supabase
        .from('boats')
        .select('id')
        .eq('owner_id', owner.id);

      const ownerBoatIds = ownerBoats?.map(b => b.id) || [];
      const ownerBookings = bookingsRes.data?.filter(b => ownerBoatIds.includes(b.boat_id)) || [];
      const pendingBookings = pendingRes.data?.length || 0;

      const totalRevenue = ownerBookings.reduce((sum, b) => sum + Number(b.total_price), 0);
      const completedBookings = ownerBookings.filter(b => b.status === 'completed').length;

      return {
        totalBoats: boatsRes.count || 0,
        totalBookings: ownerBookings.length,
        pendingBookings,
        totalRevenue,
        completedBookings,
      };
    },
    enabled: !!owner,
  });

  const statCards = [
    {
      title: 'Embarcações Ativas',
      value: stats?.totalBoats || 0,
      icon: Ship,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Reservas Totais',
      value: stats?.totalBookings || 0,
      icon: Calendar,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Pendentes',
      value: stats?.pendingBookings || 0,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Receita Total',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(stats?.totalRevenue || 0),
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">
          Olá, {owner?.marina_name || 'Proprietário'}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas embarcações e reservas
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="glass-card border-border/30 rich-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="glass-card border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/dashboard/embarcacoes/nova"
              className="p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors flex items-center gap-3"
            >
              <Ship className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">Nova Embarcação</p>
                <p className="text-sm text-muted-foreground">Cadastrar embarcação</p>
              </div>
            </a>
            <a
              href="/dashboard/reservas"
              className="p-4 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors flex items-center gap-3"
            >
              <Calendar className="h-6 w-6 text-accent" />
              <div>
                <p className="font-medium">Ver Reservas</p>
                <p className="text-sm text-muted-foreground">Gerenciar reservas</p>
              </div>
            </a>
            <a
              href="/dashboard/disponibilidade"
              className="p-4 rounded-lg bg-success/10 hover:bg-success/20 transition-colors flex items-center gap-3"
            >
              <Users className="h-6 w-6 text-success" />
              <div>
                <p className="font-medium">Disponibilidade</p>
                <p className="text-sm text-muted-foreground">Atualizar calendário</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
