import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Ship, Users, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

interface BoatManagementProps {
  owner: Tables<'owners'> | null;
}

const boatTypeLabels: Record<string, string> = {
  leisure_boat: 'Barco de Passeio',
  jet_ski: 'Jet Ski',
  yacht: 'Iate',
  sailboat: 'Veleiro',
  speedboat: 'Lancha',
  fishing_boat: 'Barco de Pesca',
  pontoon: 'Pontão',
  catamaran: 'Catamarã',
};

export function BoatManagement({ owner }: BoatManagementProps) {
  const navigate = useNavigate();

  const { data: boats, isLoading, refetch } = useQuery({
    queryKey: ['owner-boats', owner?.id],
    queryFn: async () => {
      if (!owner) return [];

      const { data, error } = await supabase
        .from('boats')
        .select(`
          *,
          boat_photos(url, is_primary)
        `)
        .eq('owner_id', owner.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!owner,
  });

  const toggleBoatStatus = async (boatId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('boats')
      .update({ is_active: !currentStatus })
      .eq('id', boatId);

    if (error) {
      toast.error('Erro ao atualizar status');
      return;
    }

    toast.success(currentStatus ? 'Embarcação desativada' : 'Embarcação ativada');
    refetch();
  };

  const deleteBoat = async (boatId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta embarcação?')) return;

    const { error } = await supabase
      .from('boats')
      .delete()
      .eq('id', boatId);

    if (error) {
      toast.error('Erro ao excluir embarcação');
      return;
    }

    toast.success('Embarcação excluída');
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Minhas Embarcações</h1>
          <p className="text-muted-foreground">Gerencie sua frota</p>
        </div>
        <Button
          onClick={() => navigate('/dashboard/embarcacoes/nova')}
          className="gradient-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Embarcação
        </Button>
      </div>

      {/* Boats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card border-border/30 animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg" />
              <CardContent className="p-4 space-y-2">
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : boats && boats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boats.map((boat) => {
            const primaryPhoto = boat.boat_photos?.find((p: any) => p.is_primary);
            const firstPhoto = boat.boat_photos?.[0];
            const photoUrl = primaryPhoto?.url || firstPhoto?.url;

            return (
              <Card
                key={boat.id}
                className={`glass-card border-border/30 rich-card overflow-hidden ${
                  !boat.is_active ? 'opacity-60' : ''
                }`}
              >
                {/* Photo */}
                <div className="h-48 bg-muted relative">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={boat.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Ship className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  <Badge
                    className={`absolute top-2 right-2 ${
                      boat.is_active
                        ? 'bg-success/80 text-success-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {boat.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg truncate">{boat.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {boatTypeLabels[boat.type] || boat.type}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {boat.capacity}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-primary mt-2">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(Number(boat.base_price))}
                    <span className="text-sm font-normal text-muted-foreground">/dia</span>
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dashboard/embarcacoes/${boat.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleBoatStatus(boat.id, boat.is_active ?? true)}
                    >
                      {boat.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteBoat(boat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="glass-card border-border/30 p-12 text-center">
          <Ship className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhuma embarcação cadastrada</h3>
          <p className="text-muted-foreground mb-4">
            Comece adicionando sua primeira embarcação à plataforma
          </p>
          <Button
            onClick={() => navigate('/dashboard/embarcacoes/nova')}
            className="gradient-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Embarcação
          </Button>
        </Card>
      )}
    </div>
  );
}
