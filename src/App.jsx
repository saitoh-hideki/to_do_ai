import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import './App.css'
import GoogleMap from './components/GoogleMap'
import GoogleCalendar from './components/GoogleCalendar'
import AiChat from './components/AiChat'
import InternalChat from './components/InternalChat'
import ClientDashboard from './components/ClientDashboard'

function App() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);

  // 新規タスク用メモ
  const [memoValue, setMemoValue] = useState('');
  // 編集中メモ
  const [editingMemo, setEditingMemo] = useState({});

  // タブ管理
  const [activeTab, setActiveTab] = useState('todo');

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
    if (activeTab === 'todo') {
      getTodos();
    }
  }, [activeTab]);

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

  // タブコンテンツのレンダリング
  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <div style={{ display: 'flex', gap: '24px', width: '100%', maxWidth: '1600px' }}>
            <div style={{ flex: 1 }}>
              <AiChat />
            </div>
            <div style={{ flex: 1 }}>
              <InternalChat />
            </div>
          </div>
        );
      case 'todo':
        return (
          <div style={{
            maxWidth: 600,
            margin: '0 auto',
            background: '#ffffff',
            padding: '32px 24px',
            borderRadius: 16,
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            width: '100%'
          }}>
            <h2 style={{ color: '#333', marginBottom: '16px', fontSize: '24px', fontWeight: 'bold' }}>ToDo管理</h2>
            <div style={{
              display: 'flex',
              gap: 24,
              marginBottom: 32,
              background: '#ffffff',
              flexDirection: 'row',
              alignItems: 'stretch'
            }}>
              <div style={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="新しいタスクを記入"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #ced4da',
                    fontSize: '18px',
                    background: '#ffffff',
                    color: '#333',
                  }}
                />
                <input
                  type="text"
                  value={memoValue}
                  onChange={handleMemoChange}
                  placeholder="メモ (任意)"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #ced4da',
                    fontSize: '18px',
                    background: '#ffffff',
                    color: '#333',
                  }}
                />
              </div>
              <button 
                onClick={handleAddTask} 
                disabled={loading}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: loading ? '#6c757d' : '#ffd700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  width: '80px',
                  height: '38px',
                  alignSelf: 'flex-start',
                  color: loading ? '#ffffff' : '#333'
                }}
              >
                追加
              </button>
            </div>
            {loading ? (
              <p style={{ fontSize: '22px', textAlign: 'center' }}>Loading tasks...</p>
            ) : (
              <ul style={{ 
                listStyle: 'none', 
                padding: 0,
                margin: 0
              }}>
                {todos.map(todo => (
                  <li 
                    key={todo.id} 
                    style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      padding: '20px',
                      borderBottom: '2px solid #e9ecef',
                      fontSize: '22px',
                      background: '#f9f9f9',
                      borderRadius: '10px',
                      marginBottom: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => handleToggleComplete(todo.id, todo.completed)}
                        style={{
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer'
                        }}
                      />
                      <span style={{ 
                        flex: 1,
                        textDecoration: todo.completed ? 'line-through' : 'none',
                        color: todo.completed ? '#6c757d' : '#333',
                        fontSize: '24px',
                        fontWeight: 'bold'
                      }}>
                        {todo.text}
                      </span>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {Object.values(STATUS).map(status => (
                          <button
                            key={status}
                            onClick={() => handleUpdateStatus(todo.id, status)}
                            style={{
                              padding: '10px 18px',
                              borderRadius: '8px',
                              border: 'none',
                              background: todo.status === status ? STATUS_COLORS[status] : '#f8f9fa',
                              color: todo.status === status ? '#ffffff' : '#333',
                              cursor: 'pointer',
                              fontSize: '18px',
                              minWidth: '90px',
                              fontWeight: todo.status === status ? 'bold' : 'normal'
                            }}
                          >
                            {STATUS_LABELS[status]}
                          </button>
                        ))}
                        <button 
                          onClick={() => handleDeleteTask(todo.id)}
                          style={{
                            padding: '10px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#dc3545',
                            color: '#ffffff',
                            cursor: 'pointer',
                            fontSize: '18px',
                            minWidth: '90px',
                            fontWeight: 'bold'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div style={{ marginTop: '10px', width: '100%' }}>
                      <input
                        type="text"
                        value={editingMemo[todo.id] !== undefined ? editingMemo[todo.id] : (todo.memo || '')}
                        placeholder="メモ"
                        onChange={e => handleEditMemoChange(todo.id, e.target.value)}
                        onBlur={() => handleSaveMemo(todo.id)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: '1.5px solid #ced4da',
                          fontSize: '20px',
                          background: '#fffbe6',
                          color: '#222'
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      case 'calendar':
        return <GoogleCalendar />;
      case 'map':
        return <GoogleMap />;
      case 'clients':
        return <ClientDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="App" style={{ minHeight: '100vh', background: '#f4f6fa', padding: '32px 0' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '32px', fontSize: '2.2rem', fontWeight: 'bold', color: '#111' }}>Dashboard</h1>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
          <button
            onClick={() => setActiveTab('todo')}
            style={{
              padding: '12px 32px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'todo' ? '#007bff' : '#e9ecef',
              color: '#111',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            ToDo
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              padding: '12px 32px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'chat' ? '#007bff' : '#e9ecef',
              color: '#111',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            チャット
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            style={{
              padding: '12px 32px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'calendar' ? '#007bff' : '#e9ecef',
              color: '#111',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            スケジュール
          </button>
          <button
            onClick={() => setActiveTab('map')}
            style={{
              padding: '12px 32px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'map' ? '#007bff' : '#e9ecef',
              color: '#111',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            ルート検索
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            style={{
              padding: '12px 32px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'clients' ? '#007bff' : '#e9ecef',
              color: '#111',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            名簿
          </button>
        </div>
        {renderTabContent()}
      </div>
    </div>
  )
}

export default App
