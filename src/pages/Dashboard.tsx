import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardHome } from '@/components/dashboard/DashboardHome';
import { BoatManagement } from '@/components/dashboard/BoatManagement';
import { BoatForm } from '@/components/dashboard/BoatForm';
import { PricingManagement } from '@/components/dashboard/PricingManagement';
import { AvailabilityManagement } from '@/components/dashboard/AvailabilityManagement';
import { BookingsManagement } from '@/components/dashboard/BookingsManagement';
import { OwnerSettings } from '@/components/dashboard/OwnerSettings';
import { Loader2 } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState<Tables<'owners'> | null>(null);

  useEffect(() => {
    checkOwnerAccess();
  }, []);

  const checkOwnerAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      // Check if user has owner role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin']);

      if (!roles || roles.length === 0) {
        navigate('/');
        return;
      }

      // Get owner profile
      const { data: ownerData } = await supabase
        .from('owners')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setOwner(ownerData);
    } catch (error) {
      console.error('Error checking owner access:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6">
        <Routes>
          <Route index element={<DashboardHome owner={owner} />} />
          <Route path="embarcacoes" element={<BoatManagement owner={owner} />} />
          <Route path="embarcacoes/nova" element={<BoatForm owner={owner} />} />
          <Route path="embarcacoes/:boatId" element={<BoatForm owner={owner} />} />
          <Route path="precos" element={<PricingManagement owner={owner} />} />
          <Route path="disponibilidade" element={<AvailabilityManagement owner={owner} />} />
          <Route path="reservas" element={<BookingsManagement owner={owner} />} />
          <Route path="configuracoes" element={<OwnerSettings owner={owner} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </MainLayout>
  );
}
