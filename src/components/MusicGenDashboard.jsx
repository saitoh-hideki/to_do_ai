import React, { useState, useRef, useEffect } from "react";

const SUPABASE_FUNCTION_URL = "https://akevbwjhvjblwedeoanw.supabase.co/functions/v1/music-gen";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrZXZid2podmpibHdlZGVvYW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MjIzMzUsImV4cCI6MjA2NjA5ODMzNX0.GoPxEWO6GlONSS7CxLd4Hi-uM90-0-M0aRzM8sHF4Vo";

const ICONS = [
  { label: "ギター", icon: "🎸", value: "ギター" },
  { label: "ピアノ", icon: "🎹", value: "ピアノ" },
  { label: "サックス", icon: "🎷", value: "サックス" },
  { label: "明るい", icon: "😊", value: "明るい雰囲気" },
  { label: "しっとり", icon: "😢", value: "しっとりした雰囲気" },
  { label: "ロック", icon: "🤘", value: "ロック" },
  { label: "ジャズ", icon: "🎺", value: "ジャズ" },
  { label: "クラシック", icon: "🎻", value: "クラシック" },
];

export default function MusicGenDashboard() {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]); // {text, reply, audioUrl, error, time}
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
    if (!inputText) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        SUPABASE_FUNCTION_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${ANON_KEY}`
          },
          body: JSON.stringify({ prompt: inputText }),
        }
      );
      const data = await res.json();
      if (res.ok && data.url) {
        setMessages(prev => [
          ...prev,
          {
            text: inputText,
            reply: "音楽を生成しました！",
            audioUrl: data.url,
            error: null,
            time: new Date().toLocaleTimeString()
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            text: inputText,
            reply: "音楽生成に失敗しました",
            audioUrl: null,
            error: data.error || "音楽生成に失敗しました",
            time: new Date().toLocaleTimeString()
          }
        ]);
      }
      setInputText("");
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          text: inputText,
          reply: "エラーが発生しました",
          audioUrl: null,
          error: err.message,
          time: new Date().toLocaleTimeString()
        }
      ]);
      setInputText("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-card" style={{ padding: 24, marginBottom: 24, background: '#181a20', color: '#fff', borderRadius: 12, boxShadow: '0 4px 24px #0008', maxWidth: 600, margin: '2rem auto' }}>
      <h2 style={{ margin: 0, fontWeight: 800, fontSize: 28, letterSpacing: '0.04em' }}>Music Chat Dashboard</h2>
      {/* アイコン選択欄 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, margin: '16px 0 24px 0' }}>
        {ICONS.map((icon, idx) => (
          <button
            key={icon.value}
            title={icon.label}
            style={{ fontSize: 24, padding: 10, borderRadius: '50%', border: 'none', background: '#23232a', color: '#ffd700', cursor: 'pointer', boxShadow: '0 2px 8px #0004' }}
            onClick={() => setInputText(inputText ? inputText + ' ' + icon.value : icon.value)}
            disabled={loading}
          >
            {icon.icon}
          </button>
        ))}
      </div>
      {/* チャット履歴欄 */}
      <div style={{ minHeight: 120, maxHeight: 240, overflowY: 'auto', background: '#23232a', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        {messages.length === 0 && <div style={{ color: '#888' }}>まだ音楽生成の履歴はありません</div>}
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: 16 }}>
            <div style={{ color: '#ffd700', fontWeight: 'bold' }}>あなた: <span style={{ color: '#fff' }}>{msg.text}</span></div>
            <div style={{ color: '#00e676', marginLeft: 12 }}>MusicGen: <span style={{ color: '#fff' }}>{msg.reply}</span></div>
            {msg.audioUrl && (
              <div style={{ marginLeft: 12, marginTop: 8 }}>
                <audio controls src={msg.audioUrl} style={{ width: "100%" }} />
                <a
                  href={msg.audioUrl}
                  download="generated_music.wav"
                  className="btn-3d"
                  style={{ display: "inline-block", marginTop: 8 }}
                >
                  ダウンロード
                </a>
              </div>
            )}
            {msg.error && <div style={{ color: "#ff6b6b", marginLeft: 12, marginTop: 4 }}>{msg.error}</div>}
            <div style={{ fontSize: 12, color: '#888', marginLeft: 12 }}>{msg.time}</div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      {/* チャット入力欄 */}
      <textarea
        value={inputText}
        onChange={e => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="音楽のイメージやキーワードを入力（エンター2回で送信）"
        style={{ width: '100%', height: 60, padding: 8, borderRadius: 6, border: '1px solid #444', background: '#23232a', color: '#fff', resize: 'vertical' }}
        disabled={loading}
      />
      <button
        className="btn-3d"
        onClick={handleSend}
        disabled={loading || !inputText}
        style={{ background: '#ffd700', color: '#222', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 'bold', cursor: 'pointer', marginTop: 8 }}
      >
        {loading ? "生成中..." : "音楽を生成"}
      </button>
    </div>
  );
} 