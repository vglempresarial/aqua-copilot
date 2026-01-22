import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Heart } from 'lucide-react';

export default function Favoritos() {
  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6 max-w-4xl">
          <div>
            <h1 className="text-2xl font-bold">Meus Favoritos</h1>
            <p className="text-muted-foreground">Em breve: salve e gerencie suas embarcações favoritas.</p>
          </div>

          <Card className="glass-card border-border/30">
            <CardContent className="p-8 text-center space-y-2">
              <Heart className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Ainda estamos implementando esta área.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
