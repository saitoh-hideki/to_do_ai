import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase設定（環境変数が設定されていない場合のフォールバック）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://akevbwjhvjblwedeoanw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrZXZid2podmpibHdlZGVvYW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MjIzMzUsImV4cCI6MjA2NjA5ODMzNX0.GoPxEWO6GlONSS7CxLd4Hi-uM90-0-M0aRzM8sHF4Vo';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// N8N Webhook URLs（直接設定）
const N8N_URLS = {
  LINE: '', // LINE用のURLを後で設定
  X: 'https://saito.app.n8n.cloud/webhook/web-app'
};

function N8NDashboard() {
  const [lineWebhookUrl, setLineWebhookUrl] = useState('');
  const [xWebhookUrl, setXWebhookUrl] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lineUsers, setLineUsers] = useState([]);
  const [selectedLineUser, setSelectedLineUser] = useState(null);
  const [newLineId, setNewLineId] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');

  // N8N設定を取得
  const fetchN8NSettings = async () => {
    try {
      console.log('設定取得開始');
      
      const { data, error } = await supabase
        .from('n8n_settings')
        .select('*')
        .single();
      
      console.log('設定取得結果:', { data, error });
      
      if (error) {
        console.error('設定取得エラー:', error);
        return;
      }
      
      if (data) {
        setLineWebhookUrl(data.line_webhook_url || '');
        setXWebhookUrl(data.x_webhook_url || '');
        console.log('設定読み込み完了:', { line: data.line_webhook_url, x: data.x_webhook_url });
      }
    } catch (err) {
      console.error('設定取得例外:', err);
    }
  };

  // LINEユーザーを取得
  const fetchLineUsers = async () => {
    try {
      console.log('LINEユーザー取得開始');
      
      const { data, error } = await supabase
        .from('line_users')
        .select('*')
        .eq('status', 'active');
      
      console.log('LINEユーザー取得結果:', { data, error });
      
      if (error) {
        console.error('LINEユーザー取得エラー:', error);
        // エラーの場合、テストユーザーを自動作成
        await createTestUser();
        return;
      }
      
      setLineUsers(data || []);
      
      if (data && data.length > 0) {
        // 最初のユーザーを選択
        setSelectedLineUser(data[0]);
        console.log('LINEユーザー読み込み完了:', data[0]);
      } else {
        // データがない場合、テストユーザーを自動作成
        await createTestUser();
      }
    } catch (err) {
      console.error('LINEユーザー取得例外:', err);
      await createTestUser();
    }
  };

  // テストユーザーを作成
  const createTestUser = async () => {
    try {
      console.log('テストユーザー作成開始');
      
      const { data, error } = await supabase
        .from('line_users')
        .insert({
          line_id: 'Udad201683381e54887eb6c7b224c76c8',
          display_name: 'テストユーザー',
          status: 'active'
        })
        .select()
        .single();
      
      if (error) {
        console.error('テストユーザー作成エラー:', error);
        return;
      }
      
      if (data) {
        setSelectedLineUser(data);
        setLineUsers([data]);
        console.log('テストユーザー作成完了:', data);
      }
    } catch (err) {
      console.error('テストユーザー作成例外:', err);
    }
  };

  useEffect(() => {
    fetchN8NSettings();
    fetchLineUsers();
  }, []);

  // N8N設定を保存
  const saveN8NSettings = async () => {
    try {
      console.log('保存開始:', { lineWebhookUrl, xWebhookUrl });
      
      const { data, error } = await supabase
        .from('n8n_settings')
        .upsert({
          id: 1,
          line_webhook_url: lineWebhookUrl,
          x_webhook_url: xWebhookUrl,
          updated_at: new Date().toISOString()
        });
      
      console.log('保存結果:', { data, error });
      
      if (error) {
        console.error('保存エラー詳細:', error);
        throw error;
      }
      
      setSuccess('N8N設定を保存しました');
      console.log('保存成功');
    } catch (err) {
      console.error('保存例外:', err);
      setError('設定の保存に失敗しました: ' + err.message);
    }
  };

  // LINEユーザーを追加
  const addLineUser = async () => {
    if (!newLineId.trim() || !newDisplayName.trim()) {
      setError('LINE IDと表示名を入力してください');
      return;
    }

    try {
      const { error } = await supabase
        .from('line_users')
        .insert({
          line_id: newLineId.trim(),
          display_name: newDisplayName.trim()
        });
      
      if (error) throw error;
      
      setSuccess('LINEユーザーを追加しました');
      setNewLineId('');
      setNewDisplayName('');
      fetchLineUsers();
    } catch (err) {
      setError('LINEユーザーの追加に失敗しました: ' + err.message);
    }
  };

  // N8N経由でLINEに送信
  const sendToLineViaN8N = async () => {
    if (!message.trim()) {
      setError('メッセージを入力してください');
      return;
    }
    if (!lineWebhookUrl.trim()) {
      setError('LINE用N8N Webhook URLを設定してください');
      return;
    }
    if (!selectedLineUser) {
      setError('送信先のLINEユーザーを選択してください');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      console.log('LINE送信開始:', { message, lineWebhookUrl, selectedLineUser });
      
      const response = await fetch(`${supabaseUrl}/functions/v1/n8n-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': 'Bearer ' + supabaseAnonKey,
        },
        body: JSON.stringify({
          event: 'line_message',
          data: { 
            message: message,
            lineId: selectedLineUser.line_id
          },
          n8nWebhookUrl: lineWebhookUrl
        }),
      });

      console.log('Supabase応答:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Supabaseエラー:', errorData);
        throw new Error(errorData.error || '送信エラー');
      }

      const result = await response.json();
      console.log('送信成功:', result);
      setSuccess('N8N経由でLINEにメッセージを送信しました');
      setMessage('');
    } catch (err) {
      console.error('送信例外:', err);
      setError('送信に失敗しました: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  // N8N経由でXに投稿
  const postToXViaN8N = async () => {
    if (!message.trim()) {
      setError('メッセージを入力してください');
      return;
    }
    if (!xWebhookUrl.trim()) {
      setError('X用N8N Webhook URLを設定してください');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      console.log('X投稿開始:', { message, xWebhookUrl });
      
      const response = await fetch(`${supabaseUrl}/functions/v1/n8n-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': 'Bearer ' + supabaseAnonKey,
        },
        body: JSON.stringify({
          event: 'x_post',
          data: { message: message },
          n8nWebhookUrl: xWebhookUrl
        }),
      });

      console.log('Supabase応答:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Supabaseエラー:', errorData);
        throw new Error(errorData.error || '投稿エラー');
      }

      const result = await response.json();
      console.log('送信成功:', result);
      setSuccess('N8N経由でXに投稿しました');
      setMessage('');
    } catch (err) {
      console.error('送信例外:', err);
      setError('投稿に失敗しました: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'center', 
      marginTop: 32,
      background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 50%, #000000 100%)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: 800, 
        background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%)', 
        borderRadius: 12, 
        padding: 24, 
        boxShadow: '0 2px 16px #0008' 
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: 24, color: '#fff', fontSize: 22 }}>N8N統合ダッシュボード</h2>
        
        {/* 説明 */}
        <div style={{ background: 'linear-gradient(135deg, #333333 0%, #2a2a2a 100%)', border: '1px solid #444', borderRadius: 8, padding: 12, marginBottom: 20 }}>
          <div style={{ color: '#00B900', fontWeight: 'bold', marginBottom: 6 }}>🚀 N8N連携</div>
          <div style={{ color: '#ccc', fontSize: 13 }}>
            ・N8Nで個別のワークフローを構築<br />
            ・LINE・X専用のWebhook URLを設定<br />
            ・各サービスに最適化された処理を実行
          </div>
        </div>

        {/* LINEユーザー管理 */}
        <div style={{ background: 'linear-gradient(135deg, #333333 0%, #2a2a2a 100%)', border: '1px solid #333', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: 10 }}>📱 LINEユーザー管理</div>
          
          {/* ユーザー追加 */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
            <input type="text" value={newLineId} onChange={e => setNewLineId(e.target.value)}
              placeholder="LINE ID"
              style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #444', background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)', color: '#fff', fontSize: 14 }} />
            <input type="text" value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)}
              placeholder="表示名"
              style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #444', background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)', color: '#fff', fontSize: 14 }} />
            <button onClick={addLineUser} className="btn-3d" style={{ padding: '8px 16px', fontSize: 14, background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold' }}>追加</button>
          </div>

          {/* ユーザー一覧 */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13 }}>送信先を選択</label>
            <select value={selectedLineUser?.id || ''} onChange={e => {
              const user = lineUsers.find(u => u.id === parseInt(e.target.value));
              setSelectedLineUser(user);
            }} style={{ width: '100%', marginTop: 4, padding: 8, borderRadius: 4, border: '1px solid #444', background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)', color: '#fff', fontSize: 14 }}>
              {lineUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.display_name} ({user.line_id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* N8N設定 */}
        <div style={{ background: 'linear-gradient(135deg, #333333 0%, #2a2a2a 100%)', border: '1px solid #333', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: 10 }}>N8N設定</div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13 }}>LINE用N8N Webhook URL</label>
            <input type="text" value={lineWebhookUrl} onChange={e => setLineWebhookUrl(e.target.value)}
              placeholder="https://your-n8n-instance.com/webhook/line..."
              style={{ width: '100%', marginTop: 4, marginBottom: 8, padding: 8, borderRadius: 4, border: '1px solid #444', background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)', color: '#fff', fontSize: 14 }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13 }}>X用N8N Webhook URL</label>
            <input type="text" value={xWebhookUrl} onChange={e => setXWebhookUrl(e.target.value)}
              placeholder="https://your-n8n-instance.com/webhook/x..."
              style={{ width: '100%', marginTop: 4, marginBottom: 8, padding: 8, borderRadius: 4, border: '1px solid #444', background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)', color: '#fff', fontSize: 14 }} />
          </div>
          <button onClick={saveN8NSettings} className="btn-3d" style={{ width: '100%', padding: 10, fontSize: 15, background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', marginTop: 4 }}>設定を保存</button>
        </div>

        {/* メッセージ入力 */}
        <div style={{ background: 'linear-gradient(135deg, #333333 0%, #2a2a2a 100%)', border: '2px solid #00B900', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ fontWeight: 'bold', color: '#00B900', marginBottom: 10 }}>📝 送信メッセージ</div>
          <textarea value={message} onChange={e => setMessage(e.target.value)}
            placeholder="LINE・Xに送信するメッセージを入力してください..."
            style={{ width: '100%', minHeight: 100, padding: 10, borderRadius: 4, border: '1.5px solid #444', background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)', color: '#fff', fontSize: 15, resize: 'vertical', fontFamily: 'inherit', marginBottom: 8 }} />
          <div style={{ textAlign: 'right', color: '#aaa', fontSize: 12 }}>{message.length} 文字</div>
        </div>

        {/* 送信ボタン */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <button onClick={sendToLineViaN8N} disabled={sending || !message.trim() || !lineWebhookUrl.trim() || !selectedLineUser} className="btn-3d"
            style={{ flex: 1, padding: 14, fontSize: 16, background: sending || !message.trim() || !lineWebhookUrl.trim() || !selectedLineUser ? '#666' : '#00B900', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: sending || !message.trim() || !lineWebhookUrl.trim() || !selectedLineUser ? 'not-allowed' : 'pointer' }}>
            {sending ? '🔄 送信中...' : '📱 LINE送信'}
          </button>
          <button onClick={postToXViaN8N} disabled={sending || !message.trim() || !xWebhookUrl.trim()} className="btn-3d"
            style={{ flex: 1, padding: 14, fontSize: 16, background: sending || !message.trim() || !xWebhookUrl.trim() ? '#666' : '#1DA1F2', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: sending || !message.trim() || !xWebhookUrl.trim() ? 'not-allowed' : 'pointer' }}>
            {sending ? '🔄 投稿中...' : '🐦 X投稿'}
          </button>
        </div>

        {error && <div style={{ background: 'linear-gradient(135deg, #3a2a2a 0%, #2a1a1a 100%)', color: '#ff6b6b', padding: 10, borderRadius: 6, marginBottom: 8, border: '1px solid #ff6b6b', fontSize: 14 }}>❌ {error}</div>}
        {success && <div style={{ background: 'linear-gradient(135deg, #2a3a2a 0%, #1a2a1a 100%)', color: '#00B900', padding: 10, borderRadius: 6, marginBottom: 8, border: '1px solid #00B900', fontSize: 14 }}>✅ {success}</div>}
      </div>
    </div>
  );
}

export default N8NDashboard; 