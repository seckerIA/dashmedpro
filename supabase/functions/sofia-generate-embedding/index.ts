/**
 * Edge Function: sofia-generate-embedding
 * Generates vector embeddings for knowledge base entries
 * Used for RAG (Retrieval-Augmented Generation) in the AI agent
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { entry_id } = await req.json();
    if (!entry_id) {
      return new Response(
        JSON.stringify({ error: 'entry_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Fetch the knowledge base entry
    const { data: entry, error: fetchError } = await supabase
      .from('sofia_knowledge_base')
      .select('title, content')
      .eq('id', entry_id)
      .single();

    if (fetchError || !entry) {
      return new Response(
        JSON.stringify({ error: 'Entry not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Combine title and content for embedding
    const text = `${entry.title}\n\n${entry.content}`.substring(0, 8000);

    // Generate embedding via OpenAI
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const embResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!embResponse.ok) {
      const errData = await embResponse.json();
      return new Response(
        JSON.stringify({ error: `OpenAI error: ${errData.error?.message || 'Unknown'}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const embData = await embResponse.json();
    const embedding = embData.data?.[0]?.embedding;

    if (!embedding) {
      return new Response(
        JSON.stringify({ error: 'Embedding generation failed — no data returned' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Save embedding to the entry
    const { error: updateError } = await supabase
      .from('sofia_knowledge_base')
      .update({ embedding, updated_at: new Date().toISOString() })
      .eq('id', entry_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: `Failed to save embedding: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, entry_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
