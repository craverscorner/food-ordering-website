import { createClient } from '@supabase/supabase-js';

// Supabase project URL
const SUPABASE_URL = 'https://sluttvpsqvaputsivnld.supabase.co';

// Service role key (your actual key)
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdXR0dnBzcXZhcHV0c2l2bmxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzUwNDU2MCwiZXhwIjoyMDYzMDgwNTYwfQ.uWYDOI77SKFojwTnrIDr8UwSEPY8A7Lj38x26P8suHU';

// Anon key
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdXR0dnBzcXZhcHV0c2l2bmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MDQ1NjAsImV4cCI6MjA2MzA4MDU2MH0.m5sLHfLM70rLzrYMRlwWUW7X-zU7OTkzopwc9utq7jg';

const testWithKey = async (keyLabel, key) => {
  const supabase = createClient(SUPABASE_URL, key);

  const { data, error } = await supabase
    .from('carts')
    .select('*')
    .limit(1);

  console.log(`\nTesting with ${keyLabel}:`);
  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Success:', data);
  }
};

const run = async () => {
  await testWithKey('anon key', SUPABASE_ANON_KEY);
  await testWithKey('service_role key', SUPABASE_SERVICE_KEY);
};

run();