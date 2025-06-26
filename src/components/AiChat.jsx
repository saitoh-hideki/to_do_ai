import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient'; // supabaseClientをインポート

const AiChat = () => {
  const chatContainerRef = useRef(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  // チャット履歴が更新されたら自動スクロール
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // チャット送信処理
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    setChatError(null);
    setChatLoading(true);
    const messageContent = chatInput.trim();
    const userMessage = { role: 'user', content: messageContent };
    setChatHistory(prev => [...prev, userMessage]);
    setChatInput('');
    try {
      // Supabaseの関数を呼び出す
      const { data, error } = await supabase.functions.invoke('openai', {
        body: { query: messageContent },
      });

      if (error) {
        throw new Error(error.message);
      }
      
      let reply = data.reply || 'No response from AI';
      setChatHistory(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setChatError(`Error: ${err.message}`);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div style={{
      background: '#ffffff',
      padding: '24px',
      borderRadius: '16px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.12)',
      height: '100%'
    }}>
      <h2 style={{ color: '#333', marginBottom: '16px', fontSize: '22px', fontWeight: 'bold' }}>AIチャット</h2>
      <div 
        ref={chatContainerRef}
        style={{ 
          height: '400px',
          overflowY: 'auto',
          marginBottom: '16px', 
          background: '#f8f9fa', 
          padding: '16px', 
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          scrollBehavior: 'smooth'
        }}
      >
        {chatHistory.length === 0 && (
          <div style={{ 
            color: '#6c757d',
            textAlign: 'center',
            padding: '20px'
          }}>
            AIに質問してみましょう！
          </div>
        )}
        {chatHistory.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div 
              key={idx} 
              style={{ 
                margin: '12px 0', 
                padding: '12px',
                textAlign: isUser ? 'right' : 'left',
                background: isUser ? '#007bff' : '#ffffff',
                color: isUser ? '#ffffff' : '#333',
                borderRadius: '12px',
                maxWidth: '80%',
                marginLeft: isUser ? 'auto' : '0',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                border: !isUser ? '1px solid #e9ecef' : 'none'
              }}
            >
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '4px',
                fontSize: '0.9em',
                color: isUser ? '#ffffff' : '#666'
              }}>
                {isUser ? 'あなた' : 'AI'}
              </div>
              <div style={{ 
                lineHeight: '1.5',
                wordBreak: 'break-word'
              }}>
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ 
        display: 'flex', 
        gap: '8px',
        marginTop: '16px'
      }}>
        <input
          type="text"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          placeholder="AIに質問..."
          style={{ 
            flex: 1,
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #ced4da',
            fontSize: '16px',
            color: '#333',
            background: '#ffffff'
          }}
          onKeyDown={e => { if (e.key === 'Enter') handleSendChat(); }}
          disabled={chatLoading}
        />
        <button 
          onClick={handleSendChat} 
          disabled={chatLoading || !chatInput.trim()}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: chatLoading ? '#6c757d' : '#007bff',
            color: '#ffffff',
            cursor: chatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {chatLoading ? '送信中...' : '送信'}
        </button>
      </div>
      {chatError && (
        <div style={{ 
          color: '#dc3545', 
          marginTop: '8px',
          padding: '8px',
          borderRadius: '4px',
          background: '#f8d7da',
          border: '1px solid #f5c6cb'
        }}>
          {chatError}
        </div>
      )}
    </div>
  );
};

export default AiChat; 