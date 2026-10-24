// NOTE: Run in Supabase SQL editor to enable Realtime:
//   ALTER TABLE matches REPLICA IDENTITY FULL;
// Then enable replication in Supabase Dashboard > Database > Replication > matches table.
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string
);
