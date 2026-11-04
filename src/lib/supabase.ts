import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wusnanvovnyeeflymrhf.supabase.co';
const supabaseKey = 'sb_publishable_6DQaBioswfhYNy4CLYeUEQ_hmHxPcFt';

export const supabase = createClient(supabaseUrl, supabaseKey);
