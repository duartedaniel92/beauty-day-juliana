-- supabase/migrations/0002_seed_services.sql

insert into services (name, price_cents, duration_minutes) values
  ('Corte', 8000, 45),
  ('Escova', 6000, 40),
  ('Coloração', 22000, 150),
  ('Manicure', 4500, 50);
