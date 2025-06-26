// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "https://deno.land/x/openai@v4.24.0/mod.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// CORSヘッダーをrag-chatと統一
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // プリフライト（OPTIONS）への対応
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("Request received for openai function");

  try {
    // 本来のリクエスト処理
    const { query } = await req.json();
    console.log("Query:", query);
    const apiKey = Deno.env.get("OPENAI_API_KEY")!;
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: query }],
    });
    const reply = completion.choices[0].message.content;
    console.log("Reply from OpenAI:", reply);

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
