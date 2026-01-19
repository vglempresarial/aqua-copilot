
-- ============================================
-- MARKETPLACE NÁUTICO - ESTRUTURA COMPLETA DO BANCO DE DADOS
-- ============================================

-- 1. TIPOS ENUMERADOS
-- ============================================

-- Roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'renter');

-- Status de reserva
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded');

-- Status de pagamento
CREATE TYPE public.payment_status AS ENUM ('pending', 'held', 'released', 'refunded', 'failed');

-- Tipo de embarcação
CREATE TYPE public.boat_type AS ENUM ('leisure_boat', 'jet_ski', 'yacht', 'sailboat', 'speedboat', 'fishing_boat', 'pontoon', 'catamaran');

-- Tipo de preço
CREATE TYPE public.pricing_type AS ENUM ('weekday', 'weekend', 'holiday', 'high_season', 'low_season', 'special');

-- Nível de fidelidade
CREATE TYPE public.loyalty_level AS ENUM ('bronze', 'silver', 'gold', 'platinum');

-- 2. TABELAS PRINCIPAIS
-- ============================================

-- Perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  loyalty_level loyalty_level DEFAULT 'bronze',
  total_rentals INTEGER DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Roles de usuário (tabela separada para segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Proprietários/Marinas
CREATE TABLE public.owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  marina_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  cover_image_url TEXT,
  description TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Brasil',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  google_calendar_id TEXT,
  google_refresh_token TEXT,
  commission_rate DECIMAL(5, 2) DEFAULT 10.00,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Embarcações
CREATE TABLE public.boats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.owners(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type boat_type NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL,
  length_meters DECIMAL(5, 2),
  has_crew BOOLEAN DEFAULT true,
  crew_included BOOLEAN DEFAULT true,
  amenities JSONB DEFAULT '[]'::jsonb,
  rules TEXT,
  deposit_amount DECIMAL(10, 2) DEFAULT 0,
  base_price DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Fotos das embarcações
CREATE TABLE public.boat_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID REFERENCES public.boats(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Roteiros
CREATE TABLE public.itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID REFERENCES public.boats(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_hours INTEGER NOT NULL,
  departure_location TEXT,
  stops JSONB DEFAULT '[]'::jsonb,
  included_items JSONB DEFAULT '[]'::jsonb,
  price_modifier DECIMAL(5, 2) DEFAULT 1.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Precificação dinâmica
CREATE TABLE public.dynamic_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID REFERENCES public.boats(id) ON DELETE CASCADE NOT NULL,
  pricing_type pricing_type NOT NULL,
  price_modifier DECIMAL(5, 2) NOT NULL,
  start_date DATE,
  end_date DATE,
  day_of_week INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Feriados brasileiros
CREATE TABLE public.holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  is_national BOOLEAN DEFAULT true,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Disponibilidade manual
CREATE TABLE public.availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID REFERENCES public.boats(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  source TEXT DEFAULT 'manual',
  google_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (boat_id, date)
);

-- Reservas
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  boat_id UUID REFERENCES public.boats(id) ON DELETE SET NULL NOT NULL,
  itinerary_id UUID REFERENCES public.itineraries(id) ON DELETE SET NULL,
  booking_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  passengers INTEGER NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  platform_fee DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  deposit_amount DECIMAL(10, 2) DEFAULT 0,
  status booking_status DEFAULT 'pending',
  customer_notes TEXT,
  owner_notes TEXT,
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Pagamentos (Escrow)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) DEFAULT 0,
  owner_amount DECIMAL(10, 2) NOT NULL,
  status payment_status DEFAULT 'pending',
  held_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Favoritos
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  boat_id UUID REFERENCES public.boats(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, boat_id)
);

-- Logs de fidelidade
CREATE TABLE public.loyalty_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  points_change INTEGER DEFAULT 0,
  discount_applied DECIMAL(5, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Conversas do chat
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.owners(id) ON DELETE SET NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Mensagens do chat
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  rich_content JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. FUNÇÕES AUXILIARES
-- ============================================

-- Função para verificar role do usuário
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- Atribuir role padrão de renter
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'renter');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular nível de fidelidade
CREATE OR REPLACE FUNCTION public.calculate_loyalty_level(total_rentals INTEGER)
RETURNS loyalty_level AS $$
BEGIN
  IF total_rentals >= 20 THEN
    RETURN 'platinum';
  ELSIF total_rentals >= 10 THEN
    RETURN 'gold';
  ELSIF total_rentals >= 5 THEN
    RETURN 'silver';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar fidelidade do usuário após reserva
CREATE OR REPLACE FUNCTION public.update_loyalty_on_booking()
RETURNS TRIGGER AS $$
DECLARE
  current_rentals INTEGER;
  new_level loyalty_level;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Incrementar total de aluguéis
    UPDATE public.profiles
    SET total_rentals = total_rentals + 1,
        loyalty_points = loyalty_points + FLOOR(NEW.total_price / 10)
    WHERE user_id = NEW.user_id
    RETURNING total_rentals INTO current_rentals;
    
    -- Calcular novo nível
    new_level := public.calculate_loyalty_level(current_rentals);
    
    UPDATE public.profiles
    SET loyalty_level = new_level
    WHERE user_id = NEW.user_id;
    
    -- Log de fidelidade
    INSERT INTO public.loyalty_logs (user_id, booking_id, action, points_change, notes)
    VALUES (NEW.user_id, NEW.id, 'booking_completed', FLOOR(NEW.total_price / 10), 'Pontos acumulados pela reserva');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para gerar slug único
CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_name TEXT)
RETURNS TEXT AS $$
DECLARE
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  new_slug := lower(regexp_replace(base_name, '[^a-zA-Z0-9]+', '-', 'g'));
  new_slug := regexp_replace(new_slug, '-+', '-', 'g');
  new_slug := trim(both '-' from new_slug);
  
  WHILE EXISTS (SELECT 1 FROM public.owners WHERE slug = new_slug) LOOP
    counter := counter + 1;
    new_slug := new_slug || '-' || counter;
  END LOOP;
  
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- 4. TRIGGERS
-- ============================================

-- Trigger para novos usuários
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_owners_updated_at
  BEFORE UPDATE ON public.owners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_boats_updated_at
  BEFORE UPDATE ON public.boats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_itineraries_updated_at
  BEFORE UPDATE ON public.itineraries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dynamic_pricing_updated_at
  BEFORE UPDATE ON public.dynamic_pricing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_availability_updated_at
  BEFORE UPDATE ON public.availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar fidelidade
CREATE TRIGGER on_booking_completed
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_loyalty_on_booking();

-- 5. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boat_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Profiles are viewable by owners for bookings"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- Políticas para user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para owners
CREATE POLICY "Owners are publicly viewable"
  ON public.owners FOR SELECT
  USING (is_active = true);

CREATE POLICY "Owner can update their own profile"
  ON public.owners FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert their own profile"
  ON public.owners FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all owners"
  ON public.owners FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para boats
CREATE POLICY "Active boats are publicly viewable"
  ON public.boats FOR SELECT
  USING (is_active = true);

CREATE POLICY "Owners can manage their own boats"
  ON public.boats FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.owners
      WHERE owners.id = boats.owner_id
      AND owners.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all boats"
  ON public.boats FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para boat_photos
CREATE POLICY "Boat photos are publicly viewable"
  ON public.boat_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.boats
      WHERE boats.id = boat_photos.boat_id
      AND boats.is_active = true
    )
  );

CREATE POLICY "Owners can manage their boat photos"
  ON public.boat_photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.boats
      JOIN public.owners ON owners.id = boats.owner_id
      WHERE boats.id = boat_photos.boat_id
      AND owners.user_id = auth.uid()
    )
  );

-- Políticas para itineraries
CREATE POLICY "Itineraries are publicly viewable"
  ON public.itineraries FOR SELECT
  USING (is_active = true);

CREATE POLICY "Owners can manage their itineraries"
  ON public.itineraries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.boats
      JOIN public.owners ON owners.id = boats.owner_id
      WHERE boats.id = itineraries.boat_id
      AND owners.user_id = auth.uid()
    )
  );

-- Políticas para dynamic_pricing
CREATE POLICY "Pricing is publicly viewable"
  ON public.dynamic_pricing FOR SELECT
  USING (is_active = true);

CREATE POLICY "Owners can manage their pricing"
  ON public.dynamic_pricing FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.boats
      JOIN public.owners ON owners.id = boats.owner_id
      WHERE boats.id = dynamic_pricing.boat_id
      AND owners.user_id = auth.uid()
    )
  );

-- Políticas para holidays
CREATE POLICY "Holidays are publicly viewable"
  ON public.holidays FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage holidays"
  ON public.holidays FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para availability
CREATE POLICY "Availability is publicly viewable"
  ON public.availability FOR SELECT
  USING (true);

CREATE POLICY "Owners can manage their availability"
  ON public.availability FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.boats
      JOIN public.owners ON owners.id = boats.owner_id
      WHERE boats.id = availability.boat_id
      AND owners.user_id = auth.uid()
    )
  );

-- Políticas para bookings
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Owners can view bookings for their boats"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.boats
      JOIN public.owners ON owners.id = boats.owner_id
      WHERE boats.id = bookings.boat_id
      AND owners.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update bookings for their boats"
  ON public.bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.boats
      JOIN public.owners ON owners.id = boats.owner_id
      WHERE boats.id = bookings.boat_id
      AND owners.user_id = auth.uid()
    )
  );

-- Políticas para payments
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = payments.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can view payments for their boats"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      JOIN public.boats ON boats.id = bookings.boat_id
      JOIN public.owners ON owners.id = boats.owner_id
      WHERE bookings.id = payments.booking_id
      AND owners.user_id = auth.uid()
    )
  );

-- Políticas para favorites
CREATE POLICY "Users can view their own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites"
  ON public.favorites FOR ALL
  USING (auth.uid() = user_id);

-- Políticas para loyalty_logs
CREATE POLICY "Users can view their own loyalty logs"
  ON public.loyalty_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Políticas para chat_conversations
CREATE POLICY "Users can view their own conversations"
  ON public.chat_conversations FOR SELECT
  USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can create conversations"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own conversations"
  ON public.chat_conversations FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Políticas para chat_messages
CREATE POLICY "Users can view messages from their conversations"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND (chat_conversations.user_id = auth.uid() OR chat_conversations.session_id IS NOT NULL)
    )
  );

CREATE POLICY "Users can insert messages to their conversations"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND (chat_conversations.user_id = auth.uid() OR chat_conversations.user_id IS NULL)
    )
  );

-- 6. INSERIR FERIADOS BRASILEIROS 2025
-- ============================================

INSERT INTO public.holidays (name, date, is_national) VALUES
  ('Confraternização Universal', '2025-01-01', true),
  ('Carnaval', '2025-03-03', true),
  ('Carnaval', '2025-03-04', true),
  ('Sexta-feira Santa', '2025-04-18', true),
  ('Tiradentes', '2025-04-21', true),
  ('Dia do Trabalho', '2025-05-01', true),
  ('Corpus Christi', '2025-06-19', true),
  ('Independência do Brasil', '2025-09-07', true),
  ('Nossa Senhora Aparecida', '2025-10-12', true),
  ('Finados', '2025-11-02', true),
  ('Proclamação da República', '2025-11-15', true),
  ('Natal', '2025-12-25', true),
  ('Confraternização Universal', '2026-01-01', true),
  ('Carnaval', '2026-02-16', true),
  ('Carnaval', '2026-02-17', true),
  ('Sexta-feira Santa', '2026-04-03', true),
  ('Tiradentes', '2026-04-21', true),
  ('Dia do Trabalho', '2026-05-01', true),
  ('Corpus Christi', '2026-06-04', true),
  ('Independência do Brasil', '2026-09-07', true),
  ('Nossa Senhora Aparecida', '2026-10-12', true),
  ('Finados', '2026-11-02', true),
  ('Proclamação da República', '2026-11-15', true),
  ('Natal', '2026-12-25', true);

-- 7. ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX idx_boats_owner_id ON public.boats(owner_id);
CREATE INDEX idx_boats_type ON public.boats(type);
CREATE INDEX idx_boats_is_active ON public.boats(is_active);
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_boat_id ON public.bookings(boat_id);
CREATE INDEX idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_availability_boat_date ON public.availability(boat_id, date);
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id);
CREATE INDEX idx_owners_slug ON public.owners(slug);
CREATE INDEX idx_holidays_date ON public.holidays(date);
