import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kvkpyxbnoguiboabmfbr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2a3B5eGJub2d1aWJvYWJtZmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5NTMyNjksImV4cCI6MjA1NDUyOTI2OX0.9kqrYujjVXW7mujfuWugkFFsFLozjzWunZln7Gz3VfY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);