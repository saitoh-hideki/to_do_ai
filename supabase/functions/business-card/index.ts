import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { OpenAI } from "https://deno.land/x/openai@v4.24.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // リクエスト受信ログ
  console.log("Edge Function business-card called");
  console.log("Request method:", req.method);

  // プリフライトリクエスト（OPTIONS）対応
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // リクエストボディのログ
    let bodyText = await req.text();
    console.log("Request body:", bodyText);
    let file_path = null;
    try {
      const body = JSON.parse(bodyText);
      file_path = body.file_path;
    } catch (e) {
      throw new Error("リクエストボディのJSONパースに失敗: " + e.message);
    }
    if (!file_path) throw new Error("file_pathがありません");
    console.log("file_path:", file_path);

    // Supabaseクライアント初期化
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    console.log("SUPABASE_URL:", supabaseUrl ? "set" : "not set");
    console.log("SUPABASE_SERVICE_ROLE_KEY:", supabaseKey ? "set" : "not set");
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Storageからファイル取得
    console.log("Downloading file from storage...");
    const { data: fileData, error: fileError } = await supabase.storage
      .from("business-cards")
      .download(file_path);
    if (fileError) throw new Error("ファイル取得に失敗: " + fileError.message);
    console.log("File downloaded. Encoding to base64...");

    // ファイルをBase64エンコード
    const fileBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
    console.log("Base64 encoding complete. Calling OpenAI...");

    // OpenAI Vision APIでOCR & 情報抽出
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    console.log("OPENAI_API_KEY:", openaiApiKey ? "set" : "not set");
    const openai = new OpenAI({ apiKey: openaiApiKey! });
    const prompt = `
      以下の名刺画像から、分かる範囲で担当者名・会社名・電話番号・メールアドレス・住所をJSONで出力してください。
      例: {"person_name": "...", "company_name": "...", "phone": "...", "email": "...", "address": "..."}
      抽出できない項目は空文字やnullで構いません。
    `;

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: [
              { type: "text", text: "名刺画像を解析してください。" },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }
            ]
          }
        ],
        max_tokens: 512,
      });
    } catch (e) {
      console.error("OpenAI API呼び出し失敗:", e);
      throw e;
    }
    console.log("OpenAI completion result:", JSON.stringify(completion));

    let jsonText = completion.choices[0].message.content;
    // コードブロックやバッククォートを除去
    jsonText = jsonText.replace(/```json|```/g, '').trim();
    let info;
    try {
      info = JSON.parse(jsonText);
    } catch (e) {
      console.error("OpenAI応答のJSONパース失敗:", jsonText);
      throw new Error("OpenAI応答のJSONパース失敗: " + e.message);
    }
    console.log("Parsed info:", JSON.stringify(info));

    // DBにINSERT
    console.log("Inserting into clients table...");
    const { error: insertError } = await supabase
      .from("clients")
      .insert([info]);
    if (insertError) throw new Error("DB登録に失敗: " + insertError.message);
    console.log("Insert complete.");

    return new Response(JSON.stringify({ success: true, info }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge Function error:", err);
    return new Response(JSON.stringify({
      error: err.message,
      stack: err.stack,
      raw: JSON.stringify(err)
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 