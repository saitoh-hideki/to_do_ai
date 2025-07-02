import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function filterValidUrls(sources: any): any {
  if (!sources || typeof sources !== 'object') return {};
  const isValidUrl = (url: any) => {
    if (typeof url !== 'string') return false;
    const trimmed = url.trim();
    return trimmed.match(/^https?:\/\//i) && !trimmed.match(/404|not[ -]?found|指定のページが見つかりません/i);
  };

  const result: any = {};
  for (const [key, value] of Object.entries(sources)) {
    if (Array.isArray(value)) {
      const validArr = value.map(v => (typeof v === 'string' ? v.trim() : v)).filter(isValidUrl);
      if (validArr.length > 0) result[key] = validArr;
    } else if (typeof value === 'object' && value !== null) {
      const filtered = filterValidUrls(value);
      if (Object.keys(filtered).length > 0) result[key] = filtered;
    } else if (isValidUrl(value)) {
      result[key] = value.trim();
    }
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { companyName } = await req.json();
    // @ts-ignore
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    console.log("OPENAI_API_KEY:", apiKey);
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    
    const searchPrompt = `会社名「${companyName}」について、インターネットで最新の情報を検索して、以下の基本情報をJSON形式で回答してください：

{
  "name": "会社名（正式名称）",
  "business": "事業内容（主要事業、サービス内容）",
  "ceo": "代表者名（社長・CEO・代表取締役）",
  "established": "設立年月日",
  "philosophy": "企業理念・ビジョン・ミッション（公式サイトやIR情報から最新のものを取得）",
  "summary": "企業概要（会社の規模、従業員数、売上、主要拠点、事業領域など最新の情報）",
  "sources": {
    "name": "情報源URL（会社名の情報源）",
    "business": "情報源URL（事業内容の情報源）",
    "ceo": "情報源URL（代表者名の情報源）",
    "established": "情報源URL（設立年月日の情報源）",
    "philosophy": "情報源URL（企業理念の情報源）",
    "summary": "情報源URL（企業概要の情報源）"
  }
}

特に以下の点に注意してください：
- sourcesには必ず実在する公式サイトや信頼できる情報源のURLのみを記載してください（推測や存在しないURL、短縮URL、リダイレクトURLは禁止）
- sourcesの各項目のURLが見つからない場合は、公式サイトトップページのURLをセットしてください
- それも見つからない場合は空文字にしてください
- 推測や自動生成したパス（例: /business, /ceo など）は絶対に使わないでください
- 企業理念・ビジョンは公式サイトやIR情報から最新のものを取得
- 企業概要は最新の財務情報、従業員数、事業規模を含める
- すべての情報はインターネットで検索可能な最新の情報を使用
- 古い情報や推測は避け、正確で信頼できる情報源から取得
- 各情報の参照元URLを必ず記載してください
- sourcesのURLは必ずhttp://またはhttps://で始まる実在するページのみ記載してください
- sourcesのURLは短縮URLやリダイレクトURLは禁止し、公式サイトや一次情報のみを記載してください

最新で正確な情報とその情報源を提供してください。`;

    // OpenAI APIリクエスト前にリクエスト内容をログ
    console.log("OpenAI API request", {
      url: "https://api.openai.com/v1/chat/completions",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "あなたは企業情報アシスタントです。インターネットで最新の企業情報を検索し、公式サイト、IR情報、ニュース記事など信頼できる情報源から正確な情報を取得して、指定された項目を簡潔にJSON形式で回答します。特に企業理念・ビジョンと企業概要については、最新の公式情報を優先して取得してください。" 
          },
          { role: "user", content: searchPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.1
      }),
    });

    let openaiRes, openaiData;
    try {
      openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { 
              role: "system", 
              content: "あなたは企業情報アシスタントです。インターネットで最新の企業情報を検索し、公式サイト、IR情報、ニュース記事など信頼できる情報源から正確な情報を取得して、指定された項目を簡潔にJSON形式で回答します。特に企業理念・ビジョンと企業概要については、最新の公式情報を優先して取得してください。" 
            },
            { role: "user", content: searchPrompt }
          ],
          max_tokens: 1000,
          temperature: 0.1
        }),
      });
      const text = await openaiRes.text();
      try {
        openaiData = JSON.parse(text);
      } catch (e) {
        openaiData = text;
      }
      console.log("OpenAI API response", {
        status: openaiRes.status,
        body: openaiData,
      });
    } catch (err) {
      console.error("OpenAI API fetch error", err);
      throw err;
    }

    if (!openaiRes.ok) {
      return new Response(JSON.stringify({ error: "OpenAI APIリクエスト失敗" }), { status: 500, headers: corsHeaders });
    }
    const data = await openaiData;
    // OpenAIの返答からJSON部分を抽出
    let content = data.choices?.[0]?.message?.content || "";
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    let info;
    if (jsonMatch) {
      try {
        info = JSON.parse(jsonMatch[0]);
      } catch (e) {
        info = { name: companyName, summary: content };
      }
    } else {
      info = { name: companyName, summary: content };
    }
    
    return new Response(JSON.stringify({
      name: info.name || info.会社名 || companyName,
      business: info.business || info.事業内容 || "",
      ceo: info.ceo || info.代表者名 || info.社長名 || "",
      established: info.established || info.設立年月日 || info.設立日 || "",
      philosophy: info.philosophy || info.企業理念 || info.ビジョン || "",
      summary: info.summary || info.企業概要 || info.概要 || content,
      sources: filterValidUrls(info.sources || {})
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 