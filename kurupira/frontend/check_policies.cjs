require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
    console.log("Checking user_profiles...");
    console.time("QueryTime");
    const { data, error } = await supabase.from('user_profiles').select('*').limit(1);
    console.timeEnd("QueryTime");
    console.log("Result:", { data, error });
}

run();
