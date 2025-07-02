import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({ email, password });
        if (result.error) throw result.error;
        alert('確認メールを送信しました。メールを確認してください。');
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        if (onLogin) onLogin();
      }
    } catch (err) {
      setError(err.message || '認証に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-card" style={{ maxWidth: 400, margin: '80px auto', background: '#fff', padding: 32, borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}>
      <div className="dashboard-card" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontWeight: 800, fontSize: 28, letterSpacing: '0.04em' }}>{isSignUp ? '新規登録' : 'ログイン'}</h2>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ padding: '12px 16px', borderRadius: 8, border: '1.5px solid #ced4da', fontSize: 16 }}
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ padding: '12px 16px', borderRadius: 8, border: '1.5px solid #ced4da', fontSize: 16 }}
        />
        {error && <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>}
        <button type="submit" className="btn-3d" disabled={loading}>
          {loading ? '処理中...' : isSignUp ? '新規登録' : 'ログイン'}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button onClick={() => setIsSignUp(!isSignUp)} className="btn-3d" style={{ background: 'none', color: '#007bff', textDecoration: 'underline', fontSize: 15 }}>
          {isSignUp ? 'ログイン画面へ' : '新規登録はこちら'}
        </button>
      </div>
    </div>
  );
}

export default Login; 