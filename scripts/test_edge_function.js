
const FUNCTION_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co/functions/v1/whatsapp-config-validate';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgyMDksImV4cCI6MjA4MTU2NDIwOX0.WO9-vzv_Vuh86TQWgNWuQ45cXa-L4GoGQfpSbvQiVMc';

async function testFunction() {
    console.log('🧪 Testando chamada à Edge Function:', FUNCTION_URL);

    try {
        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ANON_KEY}`
            },
            body: JSON.stringify({
                phone_number_id: '1234567890', // Dummy
                access_token: 'EAADummyToken123' // Dummy
            })
        });

        const status = response.status;
        console.log(`📡 Status HTTP: ${status}`);

        const text = await response.text();
        console.log(`📄 Resposta:`, text);

        if (status === 401) {
            console.log("⚠️ Erro 401: A função exige autenticação de usuário (Bearer token válido), não apenas Anon Key.");
            console.log("Isso é esperado se a função verificar 'supabase.auth.getUser()'.");
        }

    } catch (error) {
        console.error('❌ Erro de rede/fetch:', error.message);
    }
}

testFunction();
