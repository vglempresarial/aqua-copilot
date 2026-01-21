import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Save, Loader2, Link2, QrCode } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

interface OwnerSettingsProps {
  owner: Tables<'owners'> | null;
}

export function OwnerSettings({ owner }: OwnerSettingsProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    marina_name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    logo_url: '',
    cover_image_url: '',
  });

  useEffect(() => {
    if (owner) {
      setFormData({
        marina_name: owner.marina_name,
        description: owner.description || '',
        address: owner.address || '',
        city: owner.city || '',
        state: owner.state || '',
        logo_url: owner.logo_url || '',
        cover_image_url: owner.cover_image_url || '',
      });
    }
  }, [owner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!owner) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('owners')
        .update({
          marina_name: formData.marina_name,
          description: formData.description || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          logo_url: formData.logo_url || null,
          cover_image_url: formData.cover_image_url || null,
        })
        .eq('id', owner.id);

      if (error) throw error;

      toast.success('Configurações salvas!');
      queryClient.invalidateQueries({ queryKey: ['owner'] });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const ownerPageUrl = owner
    ? `${window.location.origin}/proprietario/${owner.slug}`
    : '';

  const copyLink = () => {
    navigator.clipboard.writeText(ownerPageUrl);
    toast.success('Link copiado!');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie o perfil da sua marina</p>
      </div>

      {/* Link de Bio */}
      <Card className="glass-card border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Sua Página Personalizada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use este link como seu "link da bio" nas redes sociais. Os clientes 
            poderão conversar com a IA e ver apenas suas embarcações.
          </p>
          <div className="flex gap-2">
            <Input
              value={ownerPageUrl}
              readOnly
              className="bg-muted font-mono text-sm"
            />
            <Button variant="outline" onClick={copyLink}>
              <Link2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
            <QrCode className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Em breve: QR Code para impressão em materiais físicos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <form onSubmit={handleSubmit}>
        <Card className="glass-card border-border/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Dados da Marina
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="marina_name">Nome da Marina *</Label>
              <Input
                id="marina_name"
                value={formData.marina_name}
                onChange={(e) =>
                  setFormData({ ...formData, marina_name: e.target.value })
                }
                required
                className="bg-input border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descreva sua marina, serviços oferecidos, etc."
                rows={4}
                className="bg-input border-border/50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="Ex: Angra dos Reis"
                  className="bg-input border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  placeholder="Ex: RJ"
                  className="bg-input border-border/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço Completo</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Rua, número, bairro"
                className="bg-input border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url">URL do Logo</Label>
              <Input
                id="logo_url"
                type="url"
                value={formData.logo_url}
                onChange={(e) =>
                  setFormData({ ...formData, logo_url: e.target.value })
                }
                placeholder="https://..."
                className="bg-input border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover_url">URL da Imagem de Capa</Label>
              <Input
                id="cover_url"
                type="url"
                value={formData.cover_image_url}
                onChange={(e) =>
                  setFormData({ ...formData, cover_image_url: e.target.value })
                }
                placeholder="https://..."
                className="bg-input border-border/50"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={loading} className="gradient-button">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
