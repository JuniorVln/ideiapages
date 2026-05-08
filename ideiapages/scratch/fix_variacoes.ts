import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  console.log('Updating existing "controle" variations to "claude"...');
  
  const { data, error, count } = await supabase
    .from('variacoes')
    .update({ provider: 'claude' })
    .match({ nome: 'controle' }) // Matches all default variations
    // We only update those that are currently 'controle' or NULL to avoid overwriting manually changed ones
    .or('provider.eq.controle,provider.is.null')
    .select('id');

  if (error) {
    console.error('Error updating variations:', error);
  } else {
    console.log(`Successfully updated ${data?.length || 0} variations to "claude".`);
  }
}

fix();
