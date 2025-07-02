import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { event, data, n8nWebhookUrl } = await req.json();
    
    console.log('N8N Webhook受信:', { event, data, n8nWebhookUrl });
    
    if (!n8nWebhookUrl) {
      throw new Error("N8N Webhook URLが指定されていません");
    }

    console.log('N8Nに送信開始:', n8nWebhookUrl);

    // LINE送信用のデータ構造
    let n8nData;
    if (event === 'line_message') {
      n8nData = {
        to: data.lineId || "Udad201683381e54887eb6c7b224c76c8", // 選択されたLINE ID
        message: data.message,
        event: event,
        timestamp: new Date().toISOString(),
        source: "supabase"
      };
    } else {
      // X投稿用のデータ構造（既存）
      n8nData = {
        event: event,
        data: data,
        timestamp: new Date().toISOString(),
        source: "supabase"
      };
    }

    // N8NのWebhookにデータを送信
    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(n8nData),
    });

    console.log('N8N応答:', { status: response.status, ok: response.ok });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('N8N送信エラー:', errorText);
      throw new Error(`N8N Webhook送信エラー: ${response.status} - ${errorText}`);
    }

    const responseData = await response.text();
    console.log('N8N応答データ:', responseData);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "N8Nにデータを送信しました",
      n8nResponse: responseData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Edge Function エラー:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 