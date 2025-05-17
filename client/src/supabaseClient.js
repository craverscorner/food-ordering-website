import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sluttvpsqvaputsivnld.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdXR0dnBzcXZhcHV0c2l2bmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MDQ1NjAsImV4cCI6MjA2MzA4MDU2MH0.m5sLHfLM70rLzrYMRlwWUW7X-zU7OTkzopwc9utq7jg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function makeCurrentUserAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id);
    if (error) {
      console.error('Error making user admin:', error.message);
    } else {
      alert('User is now admin!');
    }
    console.log('Profile data:', data);
    console.log('Profile error:', profileError);
    console.log('User id:', user.id);
  }
}

async function makeUserAdmin(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId);
  if (error) {
    alert('Error: ' + error.message);
  } else {
    alert('User is now admin!');
  }
} 

console.log("User fetched:", user);
console.log("User ID:", user?.id);
console.error('Error making user admin:', error.message);
console.error('Error details:', error);
