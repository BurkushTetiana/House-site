import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-supabase-url.supabase.co';
const supabaseKey = 'your-actual-anon-public-key-here';

export const supabase = createClient(supabaseUrl, supabaseKey);
window.supabaseClient = supabase; // Робимо доступним для vanilla JS