import { createClient } from '@supabase/supabase-api';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
    console.log('Checking for duplicate WhatsApp conversations...');

    const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('id, phone_number, user_id, contact_name, last_message_at')
        .order('phone_number');

    if (error) {
        console.error('Error fetching conversations:', error);
        return;
    }

    const groupedByPhone = {};
    data.forEach(c => {
        const phone = c.phone_number?.replace(/\D/g, '') || 'no-phone';
        if (!groupedByPhone[phone]) groupedByPhone[phone] = [];
        groupedByPhone[phone].push(c);
    });

    console.log('\nDuplicates found:');
    Object.entries(groupedByPhone).forEach(([phone, convs]) => {
        if (convs.length > 1) {
            console.log(`\nPhone: ${phone}`);
            convs.forEach(c => {
                console.log(`  - ID: ${c.id}, UserID: ${c.user_id}, Name: ${c.contact_name}, Last: ${c.last_message_at}`);
            });
        }
    });
}

checkDuplicates();
