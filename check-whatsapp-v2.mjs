import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://adzaqkduxnpckbcuqpmg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgyMDksImV4cCI6MjA4MTU2NDIwOX0.WO9-vzv_Vuh86TQWgNWuQ45cXa-L4GoGQfpSbvQiVMc";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkConfigs() {
    console.log('Checking WhatsApp Configs and Conversations...');

    const { data: configs } = await supabase
        .from('whatsapp_config')
        .select('user_id, phone_number_id, display_phone_number, is_active');

    console.log('\nConfigs:');
    console.table(configs);

    const { data: convs } = await supabase
        .from('whatsapp_conversations')
        .select('id, user_id, phone_number, contact_name')
        .or('phone_number.eq.5511999998888');

    console.log('\nConversations for 5511999998888:');
    console.table(convs);
}

checkConfigs();
