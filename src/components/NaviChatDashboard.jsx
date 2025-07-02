import React, { useState, useRef, useEffect } from "react";

export default function NaviChatDashboard() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookInput, setWebhookInput] = useState("");
  const [webhookSaved, setWebhookSaved] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]); // {text, reply, time}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // エンター2回で送信
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (inputText.trim() !== "" && e.target.value.endsWith("\n")) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  const handleSend = async () => {
    if (!inputText || !webhookUrl) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`n8nからのエラー: ${res.status} - ${errorBody}`);
      }
      const textResponse = await res.text();
      let reply = "";
      try {
        const data = JSON.parse(textResponse);
        reply = data.reply || data.message || textResponse;
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

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: 24, borderRadius: 12, background: "#181a20", color: '#fff', boxShadow: '0 4px 24px #0008' }}>
      <h2 style={{ color: '#fff', marginBottom: 24 }}>Navi Chat</h2>
      {/* n8n Webhook URL 設定 */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 'bold', color: '#fff' }}>n8n Webhook URL</label>
        <input
          type="text"
          value={webhookInput}
          onChange={e => setWebhookInput(e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #444', background: '#23232a', color: '#fff' }}
        />
        <button
          onClick={() => {
            setWebhookUrl(webhookInput);
            setWebhookSaved(true);
          }}
          style={{ marginTop: 8, background: '#ffd700', color: '#222', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          保存
        </button>
        {webhookSaved && <div style={{ color: '#00e676', marginTop: 4 }}>保存しました！</div>}
      </div>
      {/* チャット欄 */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ color: '#fff' }}>Navi Chat</h3>
        <div style={{ minHeight: 120, maxHeight: 240, overflowY: 'auto', background: '#23232a', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          {messages.length === 0 && <div style={{ color: '#888' }}>まだチャット履歴はありません</div>}
          {messages.map((msg, idx) => (
            <div key={idx} style={{ marginBottom: 16 }}>
              <div style={{ color: '#ffd700', fontWeight: 'bold' }}>あなた: <span style={{ color: '#fff' }}>{msg.text}</span></div>
              <div style={{ color: '#00e676', marginLeft: 12 }}>Navi: <span style={{ color: '#fff' }}>{msg.reply}</span></div>
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
          disabled={loading || !webhookUrl}
        />
        <button onClick={handleSend} disabled={loading || !inputText || !webhookUrl} style={{ background: '#ffd700', color: '#222', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 'bold', cursor: 'pointer', marginTop: 8 }}>
          {loading ? '送信中...' : '送信'}
        </button>
        {error && <div style={{ color: '#ff6b6b', marginTop: 4 }}>{error}</div>}
      </div>
    </div>
  );
} 