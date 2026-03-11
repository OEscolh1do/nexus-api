-- ============================================================================
-- 🌞 LUMI UNIFIED EQUIPMENT SCHEMA
-- ============================================================================
-- This script creates the Single Source of Truth for Engineering & Sales.
-- Run this in the Supabase SQL Editor.

-- 1. Enable UUID extension (usually enabled by default, but good practice)
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 🔌 TABLE: INVERTERS
-- Merges Commercial Data (Settings) with Deep Engineering Data (TechModule)
-- ============================================================================
create table public.inverters (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamptz default now(),
    
    -- Identity
    manufacturer text not null,     -- ex: "PHB", "Fronius"
    model text not null,            -- ex: "PHB50K-MT"
    
    -- Commercial Specs
    price numeric default 0,        -- Base Price in BRL
    warranty_years int default 5,   -- Standard Warranty
    weight_kg numeric default 0,    
    width_mm numeric default 0,
    height_mm numeric default 0,
    depth_mm numeric default 0,
    
    -- Electrical Specs (The "Deep" Data)
    power_ac_watts numeric not null,        -- Nominal Power (ex: 50000)
    efficiency_percent numeric default 98,  -- Max Efficiency (ex: 98.6)
    type text check (type in ('string', 'micro')), -- Inverter Topology
    phases text check (phases in ('single', 'biphasic', 'three')), -- Output Phasing
    
    -- MPPT & Safety Optimization (CRITICAL FOR ENGINEERING)
    mppts int not null default 1,           -- Number of Independent Trackers
    max_input_voltage numeric not null,     -- Absolute Max Voltage (Safety Limit)
    start_voltage numeric not null,         -- Wake-up Voltage
    min_mppt_voltage numeric not null,      -- MPPT Range Start
    max_mppt_voltage numeric not null,      -- MPPT Range End
    max_input_current numeric not null,     -- Max Operating Current (Total)
    max_isc_per_mppt numeric not null,      -- Max Short Circuit Current (Per MPPT)
    
    -- Metadata
    datasheet_url text,                     -- PDF Link for reference
    is_active boolean default true          -- Soft Delete flag
);

-- ============================================================================
-- ☀️ TABLE: MODULES (PV PANELS)
-- Merges Physical Dimensions with Electrical Coefficients
-- ============================================================================
create table public.modules (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamptz default now(),

    -- Identity
    manufacturer text not null,     -- ex: "Jinko", "Canadian"
    model text not null,            -- ex: "Tiger Neo 545W"
    technology text default 'perc', -- 'perc', 'topcon', 'hjt', 'shingled'
    
    -- Commercial Specs
    price numeric default 0,
    warranty_years int default 12,
    width_mm numeric not null,
    height_mm numeric not null,
    thickness_mm numeric default 30,
    weight_kg numeric default 0,
    
    -- Electrical Specs (STC)
    power_watts numeric not null,   -- Pmax
    efficiency_percent numeric,     -- Module Efficiency
    cells int,                      -- Number of Cells (ex: 144)
    
    -- Voltage & Current (Critical for String Sizing)
    voc numeric not null,           -- Voltage Open Circuit
    vmp numeric not null,           -- Voltage Max Power
    isc numeric not null,           -- Current Short Circuit
    imp numeric not null,           -- Current Max Power
    max_system_voltage numeric default 1500, -- ex: 1000V or 1500V
    max_series_fuse numeric default 25,      -- Fuse Rating
    
    -- Temperature Coefficients (Critical for High Temp Calc)
    temp_coeff_pmax_percent numeric, -- ex: -0.35
    temp_coeff_voc_percent numeric,  -- ex: -0.28
    temp_coeff_isc_percent numeric,  -- ex: 0.048
    
    -- Metadata
    datasheet_url text,
    is_active boolean default true
);

-- ============================================================================
-- 🛡️ SECURITY POLICIES (RLS)
-- Enables Public Read Access (for the App) but restricts Writes
-- ============================================================================

-- Activate RLS
alter table public.inverters enable row level security;
alter table public.modules enable row level security;

-- Policy: Allow Anon (Public) to READ everything active
create policy "Allow Public Read Active" on public.inverters
for select using (is_active = true);

create policy "Allow Public Read Active Modules" on public.modules
for select using (is_active = true);

-- Policy: Allow Authenticated (Service Role/Admin) to INSERT/UPDATE
-- Note: User needs to be logged in via Supabase Auth for this, 
-- or use Service Role Key in the Scraper.
create policy "Allow Admin Write" on public.inverters
for all using (auth.role() = 'authenticated' or auth.role() = 'service_role');

create policy "Allow Admin Write Modules" on public.modules
for all using (auth.role() = 'authenticated' or auth.role() = 'service_role');
