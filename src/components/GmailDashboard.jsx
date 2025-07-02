import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function GmailDashboard() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookError, setWebhookError] = useState("");

  // Webhook URLの読み込み
  useEffect(() => {
    const fetchWebhookUrl = async () => {
      setWebhookLoading(true);
      try {
        const { data, error } = await supabase
          .from("google_settings")
          .select("gmail_webhook_url")
          .eq("id", 1)
          .single();
        if (error) throw error;
        setWebhookUrl(data?.gmail_webhook_url || "");
      } catch (err) {
        setWebhookError("Webhook URLの読み込みに失敗しました");
      } finally {
        setWebhookLoading(false);
      }
    };
    fetchWebhookUrl();
  }, []);

  // Webhook URLの保存
  const handleSaveWebhookUrl = async () => {
    setWebhookLoading(true);
    setWebhookError("");
    try {
      const { error } = await supabase
        .from("google_settings")
        .update({ gmail_webhook_url: webhookUrl, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (error) throw error;
      setMessage("Webhook URLを保存しました");
    } catch (err) {
      setWebhookError("Webhook URLの保存に失敗しました");
    } finally {
      setWebhookLoading(false);
    }
  };

  // メール送信
  const sendMail = async () => {
    if (!webhookUrl || !to || !subject || !body) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', to, subject, body })
      });
      if (!res.ok) throw new Error('Failed to send mail');
      setMessage('メールを送信しました');
      setTo(''); setSubject(''); setBody('');
      // 送信履歴を仮で追加
      setHistory(h => [{ to, subject, body, date: new Date().toLocaleString() }, ...h]);
    } catch (err) {
      setMessage('メール送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '2rem auto', background: '#181a20', borderRadius: 12, padding: 24, color: '#fff' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Gmail Dashboard (n8n連携)</h2>

      {/* Webhook URL 設定 */}
      <div style={{ marginBottom: 24, padding: 16, background: '#23232a', borderRadius: 8 }}>
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>n8n Webhook URL for Gmail</label>
        <input
          type="text"
          value={webhookUrl}
          onChange={e => setWebhookUrl(e.target.value)}
          style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181a20', color: '#fff' }}
        />
        <button onClick={handleSaveWebhookUrl} disabled={webhookLoading} style={{ marginTop: 12, background: '#ffd700', color: '#222', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 'bold', cursor: 'pointer' }}>
          {webhookLoading ? '保存中...' : '保存'}
        </button>
        {webhookError && <div style={{ color: '#ff6b6b', marginTop: 8 }}>{webhookError}</div>}
      </div>

      <div style={{ marginBottom: 20, background: '#23232a', borderRadius: 8, padding: 16 }}>
        <h4>メール送信</h4>
        <input type="email" placeholder="宛先" value={to} onChange={e => setTo(e.target.value)} style={{ marginRight: 8, background: '#181a20', color: '#fff', border: '1px solid #444' }} />
        <input type="text" placeholder="件名" value={subject} onChange={e => setSubject(e.target.value)} style={{ marginRight: 8, background: '#181a20', color: '#fff', border: '1px solid #444' }} />
        <textarea placeholder="本文" value={body} onChange={e => setBody(e.target.value)} style={{ marginRight: 8, verticalAlign: 'top', background: '#181a20', color: '#fff', border: '1px solid #444' }} />
        <button onClick={sendMail} style={{ background: '#ffd700', color: '#222', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 'bold', cursor: 'pointer' }}>
          {loading ? '送信中...' : '送信'}
        </button>
      </div>
      {message && <div style={{ color: message.includes('失敗') ? '#ff6b6b' : '#00e676', marginBottom: 12 }}>{message}</div>}
      <div style={{ background: '#23232a', borderRadius: 8, padding: 16 }}>
        <h4>送信履歴</h4>
        <ul>
          {history.length === 0 ? <li>履歴なし</li> : history.map((h, i) => (
            <li key={i}>{h.date} 宛先: {h.to} 件名: {h.subject}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default GmailDashboard; 