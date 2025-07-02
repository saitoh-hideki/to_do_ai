import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

const InternalChat = () => {
  const chatContainerRef = useRef(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // チャット履歴が更新されたら自動スクロール
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // 初回読み込み
  useEffect(() => {
    const fetchMessages = async () => {
      setInitialLoading(true);
      const { data, error } = await supabase
        .from('internal_chat_messages')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) {
        setChatError(error.message);
      } else {
        setChatHistory(data.map(msg => ({
          role: msg.username === 'あなた' ? 'user' : 'assistant',
          content: msg.content,
          created_at: msg.created_at
        })));
      }
      setInitialLoading(false);
    };
    fetchMessages();
  }, []);

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
      // DBに保存
      await supabase.from('internal_chat_messages').insert({
        content: messageContent,
        username: 'あなた',
      });
      // RAG処理を行うEdge Functionを呼び出す
      const { data, error } = await supabase.functions.invoke('rag-chat', {
        body: { query: messageContent },
      });
      if (error) throw error;
      // AIからの回答を表示
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
      // DBにも保存（AIの返答）
      await supabase.from('internal_chat_messages').insert({
        content: data.reply,
        username: 'AI',
      });
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
      }}>社内チャット</h2>
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
            社内チャットを始めましょう！
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
                {isUser ? 'あなた' : '社内'}
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
          placeholder="社内チャット..."
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

export default InternalChat; 