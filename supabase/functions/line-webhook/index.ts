import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("=== LINE Webhook Received ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const lineChannelAccessToken = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");

    const body = await req.json();
    console.log("Request body:", JSON.stringify(body, null, 2));
    
    const events = body.events || [];
    console.log("Events count:", events.length);
    
    for (const event of events) {
      console.log("Processing event:", event.type);
      
      if (event.type === "follow") {
        const userId = event.source?.userId;
        console.log("Follow event for user:", userId);
        
        if (userId && supabaseUrl && supabaseKey) {
          let displayName = null;
          if (lineChannelAccessToken) {
            try {
              const profileRes = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
                headers: { "Authorization": `Bearer ${lineChannelAccessToken}` }
              });
              if (profileRes.ok) {
                const profile = await profileRes.json();
                displayName = profile.displayName;
              }
            } catch (error) {
              console.error("Profile fetch error:", error);
            }
          }
          
          try {
            const insertRes = await fetch(`${supabaseUrl}/rest/v1/line_users`, {
              method: "POST",
              headers: {
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates"
              },
              body: JSON.stringify({
                line_user_id: userId,
                display_name: displayName
              })
            });
            
            if (!insertRes.ok) {
              console.error("Database insert failed:", insertRes.status);
            }
          } catch (error) {
            console.error("Database error:", error);
          }
        }
      }
    }
    
    console.log("=== Webhook processed successfully ===");
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("=== Webhook Error ===");
    console.error("Error:", error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 