import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, channelAccessToken } = await req.json();
    
    if (!message) {
      throw new Error("メッセージが指定されていません");
    }
    
    if (!channelAccessToken) {
      throw new Error("チャネルアクセストークンが指定されていません");
    }

    // 1. まず友達リストを取得
    const friendsResponse = await fetch("https://api.line.me/v2/bot/followers/ids", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${channelAccessToken}`,
      },
    });

    if (!friendsResponse.ok) {
      const errorText = await friendsResponse.text();
      throw new Error(`友達リスト取得エラー: ${friendsResponse.status} - ${errorText}`);
    }

    const friendsData = await friendsResponse.json();
    const userIds = friendsData.userIds || [];

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "友達登録者がいません",
        recipientCount: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. 各ユーザーにメッセージを送信
    let successCount = 0;
    let errorCount = 0;

    for (const userId of userIds) {
      try {
        const lineResponse = await fetch("https://api.line.me/v2/bot/message/push", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${channelAccessToken}`,
          },
          body: JSON.stringify({
            to: userId,
            messages: [
              {
                type: "text",
                text: message
              }
            ]
          }),
        });

        if (lineResponse.ok) {
          successCount++;
        } else {
          errorCount++;
          console.error(`送信エラー (${userId}): ${lineResponse.status}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`送信エラー (${userId}):`, error);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `一斉送信完了: ${successCount}人に送信成功, ${errorCount}人に送信失敗`,
      recipientCount: successCount,
      totalRecipients: userIds.length,
      errorCount: errorCount
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 