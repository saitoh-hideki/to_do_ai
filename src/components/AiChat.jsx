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
      padding: window.innerWidth <= 768 ? '1px' : '2px',
      borderRadius: '6px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflowY: window.innerWidth <= 768 ? 'auto' : 'hidden',
      maxHeight: window.innerWidth <= 768 ? '100vh' : 'none'
    }}>
      <h2 style={{ 
        color: '#333', 
        marginBottom: '1px', 
        fontSize: window.innerWidth <= 768 ? '12px' : '14px', 
        fontWeight: 'bold',
        flexShrink: 0,
        minHeight: '16px'
      }}>AIチャット</h2>
      <div 
        ref={chatContainerRef}
        style={{ 
          flex: '0 1 40vh',
          overflowY: 'auto',
          marginBottom: '1px', 
          background: '#f8f9fa', 
          padding: window.innerWidth <= 768 ? '1px' : '2px', 
          borderRadius: '3px',
          border: '1px solid #e9ecef',
          scrollBehavior: 'smooth',
          minHeight: '20px',
          maxHeight: '40vh'
        }}
      >
        {chatHistory.length === 0 && (
          <div style={{ 
            color: '#6c757d',
            textAlign: 'center',
            padding: '3px',
            fontSize: window.innerWidth <= 768 ? '9px' : '11px'
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
                margin: '2px 0', 
                padding: window.innerWidth <= 768 ? '2px' : '3px',
                textAlign: isUser ? 'right' : 'left',
                background: isUser ? '#007cf0' : '#ffffff',
                color: isUser ? '#ffffff' : '#333',
                borderRadius: '4px',
                maxWidth: '80%',
                marginLeft: isUser ? 'auto' : '0',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                border: !isUser ? '1px solid #e9ecef' : 'none',
                fontSize: window.innerWidth <= 768 ? '9px' : '11px'
              }}
            >
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '0',
                fontSize: window.innerWidth <= 768 ? '0.7em' : '0.8em',
                color: isUser ? '#ffffff' : '#666'
              }}>
                {isUser ? 'あなた' : 'AI'}
              </div>
              <div style={{ 
                lineHeight: '1.1',
                wordBreak: 'break-word',
                fontSize: window.innerWidth <= 768 ? '9px' : '11px'
              }}>
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ 
        display: 'flex', 
        gap: '1px',
        marginTop: '0',
        flexShrink: 0,
        height: '24px',
        alignItems: 'center',
        background: '#fff'
      }}>
        <input
          type="text"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          placeholder="AIに質問..."
          style={{ 
            flex: 1,
            padding: window.innerWidth <= 768 ? '2px 2px' : '2px 4px',
            borderRadius: '2px',
            border: '1px solid #ced4da',
            fontSize: window.innerWidth <= 768 ? '9px' : '11px',
            color: '#333',
            background: '#ffffff',
            height: '32px',
            fontWeight: 900
          }}
          onKeyDown={e => { if (e.key === 'Enter') handleSendChat(); }}
          disabled={chatLoading}
        />
        <button 
          className="btn-3d"
          onClick={handleSendChat} 
          disabled={chatLoading || !chatInput.trim()}
        >
          {chatLoading ? '送信中...' : '送信'}
        </button>
      </div>
      {chatError && (
        <div style={{ 
          color: '#dc3545', 
          marginTop: '1px',
          padding: '1px',
          borderRadius: '2px',
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          fontSize: window.innerWidth <= 768 ? '8px' : '10px',
          flexShrink: 0
        }}>
          {chatError}
        </div>
      )}
    </div>
  );
};

export default AiChat; 