import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sluttvpsqvaputsivnld.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdXR0dnBzcXZhcHV0c2l2bmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MDQ1NjAsImV4cCI6MjA2MzA4MDU2MH0.m5sLHfLM70rLzrYMRlwWUW7X-zU7OTkzopwc9utq7jg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function makeCurrentUserAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  console.log(user.id);
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
