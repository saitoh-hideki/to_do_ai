import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../supabaseClient";

function GoogleCalendarDashboard() {
  // チャット履歴
  const [messages, setMessages] = useState([]); // {text, reply, time}
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookError, setWebhookError] = useState("");
  const [webhookSuccess, setWebhookSuccess] = useState("");
  const chatEndRef = useRef(null);

  // 追加: カレンダー・時間・内容入力用の状態
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formTitle, setFormTitle] = useState("");

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // n8n Webhook URL取得
  React.useEffect(() => {
    const fetchWebhookUrl = async () => {
      setWebhookLoading(true);
      setWebhookError("");
      try {
        const { data, error } = await supabase
          .from("google_settings")
          .select("gcal_webhook_url")
          .eq("id", 1)
          .single();
        if (error) throw error;
        setWebhookUrl(data?.gcal_webhook_url || "");
      } catch (err) {
        setWebhookError("Failed to load webhook URL");
      } finally {
        setWebhookLoading(false);
      }
    };
    fetchWebhookUrl();
  }, []);

  // チャット送信
  const handleSend = async () => {
    if (!inputText || !webhookUrl) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          text: inputText,
        }),
      });
      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`n8nからのエラー: ${res.status} - ${errorBody}`);
      }
      const textResponse = await res.text();
      let reply = "";
      try {
        const data = JSON.parse(textResponse);
        reply = data.reply || textResponse;
      } catch {
        reply = textResponse;
      }
      setMessages(prev => [
        ...prev,
        { text: inputText, reply, time: new Date().toLocaleTimeString() }
      ]);
      setInputText("");
    } catch (err) {
      setError("送信に失敗しました: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // エンター2回で送信
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (inputText.trim() !== "" && e.target.value.endsWith("\n")) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: 24, borderRadius: 12, background: "#181a20", color: '#fff', boxShadow: '0 4px 24px #0008' }}>
      <h2 style={{ color: '#fff', marginBottom: 24 }}>Google Calendar Chat</h2>
      {/* Webhook URL 設定（そのまま） */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 'bold', color: '#fff' }}>n8n Webhook URL</label>
        <input
          type="text"
          value={webhookUrl}
          onChange={e => setWebhookUrl(e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #444', background: '#23232a', color: '#fff' }}
        />
        <button onClick={async () => {
          setWebhookLoading(true);
          setWebhookError("");
          setWebhookSuccess("");
          try {
            const { error } = await supabase
              .from("google_settings")
              .update({ gcal_webhook_url: webhookUrl, updated_at: new Date().toISOString() })
              .eq("id", 1);
            if (error) throw error;
            setWebhookSuccess("保存しました！");
          } catch (err) {
            setWebhookError(`保存失敗: ${err.message}`);
          } finally {
            setWebhookLoading(false);
          }
        }} disabled={webhookLoading} style={{ marginTop: 8, background: '#ffd700', color: '#222', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 'bold', cursor: 'pointer' }}>
          {webhookLoading ? '保存中...' : '保存'}
        </button>
        {webhookError && <div style={{ color: '#ff6b6b', marginTop: 4 }}>{webhookError}</div>}
        {webhookSuccess && <div style={{ color: '#00e676', marginTop: 4 }}>{webhookSuccess}</div>}
      </div>
      {/* チャット欄 */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ color: '#fff' }}>Google Calendar Chat</h3>
        <div style={{ minHeight: 120, maxHeight: 240, overflowY: 'auto', background: '#23232a', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          {messages.length === 0 && <div style={{ color: '#888' }}>本日の返信はありません</div>}
          {messages.map((msg, idx) => (
            <div key={idx} style={{ marginBottom: 16 }}>
              <div style={{ color: '#ffd700', fontWeight: 'bold' }}>あなた: <span style={{ color: '#fff' }}>{msg.text}</span></div>
              <div style={{ color: '#00e676', marginLeft: 12 }}>Google君: <span style={{ color: '#fff' }}>{msg.reply}</span></div>
              <div style={{ fontSize: 12, color: '#888', marginLeft: 12 }}>{msg.time}</div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ここにチャット内容を入力してください... (エンター2回で送信)"
          style={{ width: '100%', height: 60, padding: 8, borderRadius: 6, border: '1px solid #444', background: '#23232a', color: '#fff', resize: 'vertical' }}
        />
        <button onClick={handleSend} disabled={loading || !inputText || !webhookUrl} style={{ background: '#ffd700', color: '#222', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 'bold', cursor: 'pointer', marginTop: 8 }}>
          {loading ? '送信中...' : '送信'}
        </button>
        {error && <div style={{ color: '#ff6b6b', marginTop: 4 }}>{error}</div>}
      </div>
      {/* カレンダー・時間・内容入力UI */}
      <div style={{ marginBottom: 24, background: '#23232a', borderRadius: 8, padding: 16 }}>
        <h4 style={{ color: '#fff', marginBottom: 8 }}>予定を入力して送信</h4>
        <input
          type="date"
          value={formDate}
          onChange={e => setFormDate(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: '1px solid #444', marginRight: 8, marginBottom: 8, background: '#181a20', color: '#fff' }}
        />
        <input
          type="time"
          value={formTime}
          onChange={e => setFormTime(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: '1px solid #444', marginRight: 8, marginBottom: 8, background: '#181a20', color: '#fff' }}
        />
        <input
          type="text"
          placeholder="内容（タイトル）"
          value={formTitle}
          onChange={e => setFormTitle(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: '1px solid #444', marginRight: 8, marginBottom: 8, width: 180, background: '#181a20', color: '#fff' }}
        />
        <button
          style={{ background: '#ffd700', color: '#222', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 'bold', cursor: 'pointer', marginBottom: 8 }}
          disabled={!formDate || !formTime || !formTitle}
          onClick={() => {
            // テキストを自動生成してチャット欄に反映
            const text = `${formDate} ${formTime} ${formTitle}`;
            setInputText(text);
          }}
        >
          この内容で送信欄にセット
        </button>
        <button
          style={{ background: '#00e676', color: '#222', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 'bold', cursor: 'pointer', marginLeft: 8, marginBottom: 8 }}
          disabled={!formDate || !formTime || !formTitle || !webhookUrl}
          onClick={async () => {
            const text = `${formDate} ${formTime} ${formTitle}`;
            setInputText("");
            setLoading(true);
            setError("");
            try {
              const res = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "create",
                  text,
                }),
              });
              if (!res.ok) {
                const errorBody = await res.text();
                throw new Error(`n8nからのエラー: ${res.status} - ${errorBody}`);
              }
              const textResponse = await res.text();
              let reply = "";
              try {
                const data = JSON.parse(textResponse);
                reply = data.reply || textResponse;
              } catch {
                reply = textResponse;
              }
              setMessages(prev => [
                ...prev,
                { text, reply, time: new Date().toLocaleTimeString() }
              ]);
              setFormDate(""); setFormTime(""); setFormTitle("");
            } catch (err) {
              setError("送信に失敗しました: " + err.message);
            } finally {
              setLoading(false);
            }
          }}
        >
          この内容ですぐ送信
        </button>
      </div>
    </div>
  );
}

export default GoogleCalendarDashboard; 