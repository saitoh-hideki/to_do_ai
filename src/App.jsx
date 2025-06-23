import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getTodos = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('todos')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;
        setTodos(data);
      } catch (error) {
        alert(error.message);
      } finally {
        setLoading(false);
      }
    };
    getTodos();
  }, []);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleAddTask = async () => {
    if (inputValue.trim() === '') return;
    try {
      const { data: newTodo, error } = await supabase
        .from('todos')
        .insert({ text: inputValue, completed: false })
        .select()
        .single();

      if (error) throw error;
      setTodos([...todos, newTodo]);
      setInputValue('');
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

  const handleDeleteTask = async (id) => {
    try {
      const { error } = await supabase.from('todos').delete().eq('id', id);

      if (error) throw error;
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <>
      <h1>ToDo App with Supabase</h1>
      <div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Add a new task"
        />
        <button onClick={handleAddTask} disabled={loading}>
          {loading ? 'Adding...' : 'Add'}
        </button>
      </div>
      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <ul>
          {todos.map(todo => (
            <li key={todo.id} style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggleComplete(todo.id, todo.completed)}
              />
              {todo.text}
              <button onClick={() => handleDeleteTask(todo.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default App
