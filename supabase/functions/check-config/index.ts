
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, supabaseKey);

// IDs para checar
const medicoId = "2cffb770-1afe-4dc7-bf7f-4d2a0969ec51";
// Vou checar todos para garantir

console.log("--- Verificando configs de IA ---");

const { data: configs, error } = await supabase
    .from("whatsapp_ai_config")
    .select("*");

if (error) {
    console.error("Erro ao ler configs:", error);
} else {
    console.log("Total de configs encontradas:", configs.length);
    configs.forEach(c => {
        console.log(`User: ${c.user_id} | AutoReply: ${c.auto_reply_enabled} | Created: ${c.created_at}`);
        if (c.user_id === medicoId) {
            console.log(">>> ENCONTRADA CONFIG DO MÉDICO! <<<");
        }
    });
}

console.log("\n--- Verificando Conversa ---");
// Pegar uma conversa desse médico para confirmar o ID
const { data: convs } = await supabase
    .from("whatsapp_conversations")
    .select("id, user_id, phone_number")
    .eq("user_id", medicoId)
    .limit(1);

console.log("Conversas do médico:", convs);
