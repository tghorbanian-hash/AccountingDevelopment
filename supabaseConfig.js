/* Filename: supabaseConfig.js */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jkfqvwcremjhdamkhime.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprZnF2d2NyZW1qaGRhbWtoaW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NjcyNjgsImV4cCI6MjA4NjU0MzI2OH0.mjTh1pNjJC-RIsSggels1tpUTNRA-wLfMvnseIxPm7Y';

window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);