-- Users table (sudah ada di Supabase Auth, kita extend dengan role)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  unit TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_started_at TIMESTAMPTZ,
  premium_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations table
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  pricing_scheme TEXT NOT NULL CHECK (pricing_scheme IN ('fixed', 'progressive', 'size_based')),
  base_price INTEGER DEFAULT 0,
  progressive_rules JSONB,
  size_pricing JSONB,
  member_discount INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Packages table
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number TEXT NOT NULL UNIQUE,
  pickup_code TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  size TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large', 'extra_large')),
  status TEXT NOT NULL DEFAULT 'arrived' CHECK (status IN ('arrived', 'picked_up', 'destroyed')),
  photo_url TEXT,
  notes TEXT,
  arrived_at TIMESTAMPTZ DEFAULT NOW(),
  picked_up_at TIMESTAMPTZ,
  destroyed_at TIMESTAMPTZ,
  price INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table (key-value store)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_packages_customer ON public.packages(customer_id);
CREATE INDEX IF NOT EXISTS idx_packages_location ON public.packages(location_id);
CREATE INDEX IF NOT EXISTS idx_packages_status ON public.packages(status);
CREATE INDEX IF NOT EXISTS idx_packages_arrived_at ON public.packages(arrived_at);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

-- Row Level Security (RLS) - enable untuk semua table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Policies (authenticated users dapat akses, admin dapat semua)
-- User profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Customers (authenticated users dapat akses)
CREATE POLICY "Authenticated users can view customers" ON public.customers
  FOR SELECT USING (auth.role() = 'authenticated');
  
CREATE POLICY "Authenticated users can insert customers" ON public.customers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  
CREATE POLICY "Authenticated users can update customers" ON public.customers
  FOR UPDATE USING (auth.role() = 'authenticated');
  
CREATE POLICY "Admins can delete customers" ON public.customers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Locations (similar policies)
CREATE POLICY "Authenticated users can view locations" ON public.locations
  FOR SELECT USING (auth.role() = 'authenticated');
  
CREATE POLICY "Admins can manage locations" ON public.locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Packages (similar policies)
CREATE POLICY "Authenticated users can view packages" ON public.packages
  FOR SELECT USING (auth.role() = 'authenticated');
  
CREATE POLICY "Authenticated users can insert packages" ON public.packages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  
CREATE POLICY "Authenticated users can update packages" ON public.packages
  FOR UPDATE USING (auth.role() = 'authenticated');
  
CREATE POLICY "Admins can delete packages" ON public.packages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Settings (only admins)
CREATE POLICY "Admins can manage settings" ON public.settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default data
INSERT INTO public.settings (key, value) VALUES
  ('app', '{"language": "id", "companyName": "PickPoint", "autoGeneratePickupCode": true, "pickupCodeLength": 6}'::jsonb),
  ('whatsapp', '{"enabled": true, "apiUrl": "https://seen.getsender.id/send-message", "sender": "6285777875132", "method": "POST", "sendArrivalNotification": true, "sendMembershipNotification": true, "sendReminderNotification": true, "reminderDays": 7}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Insert default location
INSERT INTO public.locations (name, address, pricing_scheme, base_price, member_discount, is_active)
VALUES ('Main Office', 'Jl. Utama No. 123', 'fixed', 5000, 10, true)
ON CONFLICT DO NOTHING;
