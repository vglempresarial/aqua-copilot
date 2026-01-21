import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Loader2, Anchor, MapPin } from 'lucide-react';

export default function OwnerPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: owner, isLoading, error } = useQuery({
    queryKey: ['owner', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('owners')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !owner) {
    return (
      <MainLayout>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Anchor className="h-16 w-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Marina não encontrada</h1>
          <p className="text-muted-foreground">
            O proprietário que você procura não existe ou está inativo.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col">
        {/* Owner Header */}
        <div className="glass-card border-b border-border/30 p-6">
          <div className="flex items-center gap-4">
            {owner.logo_url ? (
              <img
                src={owner.logo_url}
                alt={owner.marina_name}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Anchor className="h-8 w-8 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold gradient-text">{owner.marina_name}</h1>
              {owner.city && owner.state && (
                <div className="flex items-center gap-1 text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>{owner.city}, {owner.state}</span>
                </div>
              )}
            </div>
          </div>
          {owner.description && (
            <p className="mt-4 text-muted-foreground">{owner.description}</p>
          )}
        </div>

        {/* Chat filtered by owner */}
        <ChatInterface ownerId={owner.id} />
      </div>
    </MainLayout>
  );
}
