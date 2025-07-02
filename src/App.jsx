import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import './App.css'
import GoogleMap from './components/GoogleMap'
import AiChat from './components/AiChat'
import InternalChat from './components/InternalChat'
import ClientDashboard from './components/ClientDashboard'
import CompanySearchDashboard from './components/CompanySearchDashboard'
import MusicGenDashboard from './components/MusicGenDashboard'
import N8NDashboard from './components/N8NDashboard'
import GoogleCalendarDashboard from './components/GoogleCalendarDashboard'
import GmailDashboard from './components/GmailDashboard'
import NaviChatDashboard from './components/NaviChatDashboard'

// タスクのステータス定義
const STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done'
};

const STATUS_LABELS = {
  [STATUS.TODO]: '未着手',
  [STATUS.IN_PROGRESS]: '対応中',
  [STATUS.DONE]: '完了'
};

const STATUS_COLORS = {
  [STATUS.TODO]: '#6c757d',
  [STATUS.IN_PROGRESS]: '#007bff',
  [STATUS.DONE]: '#28a745'
};

function App() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);

  // 新規タスク用メモ
  const [memoValue, setMemoValue] = useState('');
  // 編集中メモ
  const [editingMemo, setEditingMemo] = useState({});

  // メニュー選択状態の管理
  const [selectedMenu, setSelectedMenu] = useState('gcal'); // 例: デフォルトはGoogle Calendar Chat

  useEffect(() => {
    const getTodos = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('todos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTodos(data);
      } catch (error) {
        alert(error.message);
      } finally {
        setLoading(false);
      }
    };
    if (selectedMenu === 'todo') {
      getTodos();
    }
  }, [selectedMenu]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleMemoChange = (e) => {
    setMemoValue(e.target.value);
  };

  const handleEditMemoChange = (id, value) => {
    setEditingMemo(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveMemo = async (id) => {
    const newMemo = editingMemo[id] ?? '';
    try {
      const { error } = await supabase
        .from('todos')
        .update({ memo: newMemo })
        .eq('id', id);
      if (error) throw error;
      setTodos(todos.map(todo => todo.id === id ? { ...todo, memo: newMemo } : todo));
    } catch (error) {
      alert(error.message);
    }
  };

  const handleAddTask = async () => {
    if (inputValue.trim() === '') return;
    try {
      const { data: newTodo, error } = await supabase
        .from('todos')
        .insert({ 
          text: inputValue, 
          completed: false,
          status: STATUS.TODO,
          memo: memoValue
        })
        .select()
        .single();

      if (error) throw error;
      setTodos([newTodo, ...todos]);
      setInputValue('');
      setMemoValue('');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleToggleComplete = async (id, completed) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', id);

      if (error) throw error;
      setTodos(
        todos.map(todo =>
          todo.id === id ? { ...todo, completed: !completed } : todo
        )
      );
    } catch (error) {
      alert(error.message);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setTodos(
        todos.map(todo =>
          todo.id === id ? { ...todo, status: newStatus } : todo
        )
      );
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      const { error } = await supabase.from('todos').delete().eq('id', id);

      if (error) throw error;
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      alert(error.message);
    }
  };

  // タブメニュー定義
  const menuItems = [
    { key: 'todo', label: 'ToDo' },
    { key: 'chat', label: 'Chat' },
    { key: 'map', label: 'Route Search' },
    { key: 'clients', label: 'Clients' },
    { key: 'company', label: 'Company Search' },
    { key: 'music', label: 'Music Gen' },
    { key: 'n8n', label: 'N8N' },
    { key: 'gcal', label: 'Google Calendar Chat' },
    { key: 'gmail', label: 'Gmail' },
    { key: 'navichat', label: 'Navi Chat' },
  ];

  // タブコンテンツのレンダリング
  const renderTabContent = () => {
    switch (selectedMenu) {
      case 'chat':
        return (
          <div style={{ 
            display: 'flex', 
            gap: '24px', 
            width: '100%', 
            height: '100%',
            flexDirection: window.innerWidth <= 768 ? 'column' : 'row'
          }}>
            <div style={{ flex: 1, minHeight: window.innerWidth <= 768 ? '50%' : 'auto' }}>
              <AiChat />
            </div>
            <div style={{ flex: 1, minHeight: window.innerWidth <= 768 ? '50%' : 'auto' }}>
              <InternalChat />
            </div>
          </div>
        );
      case 'todo':
        return (
          <div style={{
            width: '100%',
            height: '100%',
            background: '#23232a',
            padding: window.innerWidth <= 768 ? '16px' : '32px',
            borderRadius: 16,
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            overflowY: window.innerWidth <= 768 ? 'auto' : 'hidden',
            maxHeight: window.innerWidth <= 768 ? '100vh' : 'none',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h2 style={{ 
              color: '#fff', 
              marginBottom: '16px', 
              fontSize: window.innerWidth <= 768 ? '20px' : '24px', 
              fontWeight: 'bold',
              flexShrink: 0
            }}>ToDo管理</h2>
            <div style={{
              display: 'flex',
              gap: window.innerWidth <= 768 ? 12 : 24,
              marginBottom: 16,
              background: 'transparent',
              flexDirection: 'row',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="新しいタスクを記入"
                  style={{
                    width: window.innerWidth <= 768 ? '90vw' : '600px',
                    maxWidth: '100%',
                    minWidth: '200px',
                    padding: window.innerWidth <= 768 ? '10px 12px' : '12px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #444',
                    fontSize: window.innerWidth <= 768 ? '16px' : '18px',
                    background: '#181a20',
                    color: '#fff',
                  }}
                />
                <input
                  type="text"
                  value={memoValue}
                  onChange={handleMemoChange}
                  placeholder="メモ (任意)"
                  style={{
                    width: window.innerWidth <= 768 ? '90vw' : '600px',
                    maxWidth: '100%',
                    minWidth: '200px',
                    padding: window.innerWidth <= 768 ? '10px 12px' : '12px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #444',
                    fontSize: window.innerWidth <= 768 ? '16px' : '18px',
                    background: '#181a20',
                    color: '#fff',
                  }}
                />
              </div>
              <button 
                onClick={handleAddTask} 
                disabled={loading}
                style={{
                  marginLeft: 12,
                  padding: window.innerWidth <= 768 ? '10px 16px' : '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: loading ? '#6c757d' : '#ffd700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                  fontWeight: 'bold',
                  width: window.innerWidth <= 768 ? '100%' : '80px',
                  height: window.innerWidth <= 768 ? 'auto' : '38px',
                  alignSelf: 'center',
                  color: loading ? '#ffffff' : '#222'
                }}
              >
                追加
              </button>
            </div>
            {loading ? (
              <div style={{ 
                fontSize: window.innerWidth <= 768 ? '18px' : '22px', 
                textAlign: 'center',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                Loading tasks...
              </div>
            ) : (
              <ul style={{ 
                listStyle: 'none', 
                padding: 0,
                margin: 0,
                flex: 1,
                overflowY: 'auto',
                maxHeight: window.innerWidth <= 768 ? '60vh' : '400px',
              }}>
                {todos.map(todo => (
                  <li 
                    key={todo.id} 
                    style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      padding: window.innerWidth <= 768 ? '16px' : '20px',
                      borderBottom: '2px solid #333',
                      fontSize: window.innerWidth <= 768 ? '18px' : '22px',
                      background: '#282c34',
                      borderRadius: '10px',
                      marginBottom: '16px',
                      color: '#fff',
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: window.innerWidth <= 768 ? '12px' : '20px',
                      flexDirection: window.innerWidth <= 768 ? 'column' : 'row'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: window.innerWidth <= 768 ? '12px' : '20px',
                        width: '100%'
                      }}>
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => handleToggleComplete(todo.id, todo.completed)}
                          style={{
                            width: window.innerWidth <= 768 ? '24px' : '28px',
                            height: window.innerWidth <= 768 ? '24px' : '28px',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{ 
                          flex: 1,
                          textDecoration: todo.completed ? 'line-through' : 'none',
                          color: todo.completed ? '#bbb' : '#fff',
                          fontSize: window.innerWidth <= 768 ? '20px' : '24px',
                          fontWeight: 'bold'
                        }}>
                          {todo.text}
                        </span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        gap: window.innerWidth <= 768 ? '8px' : '12px', 
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        width: window.innerWidth <= 768 ? '100%' : 'auto'
                      }}>
                        {Object.values(STATUS).map(status => (
                          <button
                            key={status}
                            onClick={() => handleUpdateStatus(todo.id, status)}
                            style={{
                              padding: window.innerWidth <= 768 ? '8px 12px' : '10px 18px',
                              borderRadius: '8px',
                              border: 'none',
                              background: todo.status === status ? STATUS_COLORS[status] : '#444',
                              color: todo.status === status ? '#fff' : '#ffd700',
                              cursor: 'pointer',
                              fontSize: window.innerWidth <= 768 ? '14px' : '18px',
                              minWidth: window.innerWidth <= 768 ? '70px' : '90px',
                              fontWeight: todo.status === status ? 'bold' : 'normal'
                            }}
                          >
                            {STATUS_LABELS[status]}
                          </button>
                        ))}
                        <button 
                          onClick={() => handleDeleteTask(todo.id)}
                          style={{
                            padding: window.innerWidth <= 768 ? '8px 12px' : '10px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#dc3545',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: window.innerWidth <= 768 ? '14px' : '18px',
                            minWidth: window.innerWidth <= 768 ? '70px' : '90px',
                            fontWeight: 'bold'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div style={{ marginTop: '10px', width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
                      <input
                        type="text"
                        value={editingMemo[todo.id] !== undefined ? editingMemo[todo.id] : (todo.memo || '')}
                        placeholder="メモ"
                        onChange={e => handleEditMemoChange(todo.id, e.target.value)}
                        onBlur={() => handleSaveMemo(todo.id)}
                        style={{
                          width: window.innerWidth <= 768 ? '90vw' : '600px',
                          maxWidth: '100%',
                          minWidth: '200px',
                          padding: window.innerWidth <= 768 ? '10px 12px' : '12px 16px',
                          borderRadius: '10px',
                          border: '1.5px solid #444',
                          fontSize: window.innerWidth <= 768 ? '16px' : '18px',
                          background: '#23232a',
                          color: '#fff'
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      case 'map':
        return <div style={{ width: '100%', height: '100%' }}><GoogleMap /></div>;
      case 'clients':
        return <div style={{ width: '100%', height: '100%' }}><ClientDashboard /></div>;
      case 'company':
        return <CompanySearchDashboard />;
      case 'music':
        return <MusicGenDashboard />;
      case 'n8n':
        return <N8NDashboard />;
      case 'gcal':
        return <GoogleCalendarDashboard />;
      case 'gmail':
        return <GmailDashboard />;
      case 'navichat':
        return <NaviChatDashboard />;
      default:
        return null;
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#181a20',
      display: 'flex',
      flexDirection: 'row',
      overflow: 'hidden',
    }}>
      {/* サイドバー */}
      <aside style={{
        width: 210,
        background: 'linear-gradient(180deg, #181a20 80%, #23232a 100%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        padding: '32px 0 24px 0',
        boxShadow: '2px 0 16px #0006',
        zIndex: 2,
        minHeight: '100vh',
      }}>
        <div style={{
          fontWeight: 900,
          fontSize: 22,
          textAlign: 'center',
          marginBottom: 32,
          letterSpacing: '0.04em',
          textShadow: '0 2px 24px #D7DDE8, 0 1px 0 #757F9A',
          userSelect: 'none',
        }}>
          My Business<br />Dashboard
        </div>
        {menuItems.map(item => (
          <button
            key={item.key}
            onClick={() => setSelectedMenu(item.key)}
            style={{
              width: '90%',
              margin: '0 auto 12px auto',
              padding: '14px 0',
              borderRadius: 8,
              border: 'none',
              background: selectedMenu === item.key ? 'linear-gradient(90deg, #ffd700 60%, #ffe066 100%)' : 'rgba(255,255,255,0.04)',
              color: selectedMenu === item.key ? '#222' : '#fff',
              fontWeight: selectedMenu === item.key ? 'bold' : 'normal',
              fontSize: 16,
              boxShadow: selectedMenu === item.key ? '0 2px 12px #ffd70044' : 'none',
              cursor: 'pointer',
              outline: 'none',
              borderLeft: selectedMenu === item.key ? '6px solid #ffd700' : '6px solid transparent',
              transition: 'all 0.15s',
              textAlign: 'left',
            }}
          >
            {item.label}
          </button>
        ))}
      </aside>
      {/* メインコンテンツ */}
      <main style={{
        flex: 1,
        background: '#f4f6fa',
        padding: '32px 0',
        overflow: 'auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
          padding: '0 24px',
          boxSizing: 'border-box',
        }}>
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
