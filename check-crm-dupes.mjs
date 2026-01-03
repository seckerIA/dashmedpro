import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://adzaqkduxnpckbcuqpmg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgyMDksImV4cCI6MjA4MTU2NDIwOX0.WO9-vzv_Vuh86TQWgNWuQ45cXa-L4GoGQfpSbvQiVMc";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkCRMDuplicates() {
    console.log('Verificando duplicatas no CRM...');

    const { data: contacts, error } = await supabase
        .from('crm_contacts')
        .select('id, full_name, phone, user_id')
        .or('phone.eq.5511999998888,phone.eq.11999998888');

    if (error) {
        console.error('Erro:', error);
        return;
    }

    console.log('\nContatos encontrados para o número:');
    console.table(contacts);
}

checkCRMDuplicates();
