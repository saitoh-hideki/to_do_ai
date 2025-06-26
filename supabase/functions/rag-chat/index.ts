/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.24.0/mod.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORSヘッダー
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // OPTIONSリクエスト（プリフライト）への対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. リクエストから質問内容を取得
    const { query } = await req.json();
    if (!query) {
      throw new Error('質問内容がありません。');
    }

    // 2. SupabaseクライアントとOpenAIクライアントを初期化
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

    // 3. 質問をベクトル化
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 4. データベースから関連ドキュメントを検索
    const { data: documents, error } = await supabaseClient.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.1, // 類似度の閾値を下げる（0.7 → 0.1）
      match_count: 5,       // 取得するドキュメント数
    });

    if (error) {
      throw new Error(`ドキュメント検索に失敗しました: ${error.message}`);
    }

    // 5. AIへの指示（プロンプト）を作成
    const contextText = documents.map((doc: any) => doc.content).join('\n---\n');
    const prompt = `
      あなたは誠実で優秀なアシスタントです。
      以下の「コンテキスト情報」だけを元にして、ユーザーの「質問」に日本語で回答してください。
      コンテキスト情報に答えがない場合は、「分かりません」と正直に答えてください。

      コンテキスト情報:
      ${contextText}

      質問:
      ${query}
    `;

    // 6. AIに回答を生成させる
    const completionResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2, // 回答のランダム性を抑える
    });
    const reply = completionResponse.choices[0].message.content;

    // 7. 回答を返す
    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    // エラーハンドリング
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 