import { useEffect, useState } from 'react';

const GoogleCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Google Calendar APIの初期化
    const initCalendar = async () => {
      setLoading(true);
      try {
        // ここでGoogle Calendar APIを呼び出し
        // 実際の実装では、Google Calendar APIの認証とイベント取得が必要
        console.log('Google Calendar API の初期化');
      } catch (error) {
        console.error('Google Calendar の読み込みに失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    initCalendar();
  }, []);

  const addEvent = () => {
    // 新しいイベントを追加する機能
    console.log('新しいイベントを追加');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ color: '#111', fontWeight: 'bold', fontSize: '24px', marginBottom: '20px' }}>スケジュール</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={addEvent}
          style={{
            padding: '12px 24px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          新しい予定を追加
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>カレンダーを読み込み中...</p>
        </div>
      ) : (
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '20px',
          minHeight: '400px',
          backgroundColor: '#f8f9fa'
        }}>
          <h3>今週の予定</h3>
          {events.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', marginTop: '40px' }}>
              Google Calendar APIの設定が必要です。<br />
              営業予定や商談スケジュールがここに表示されます。
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {events.map((event, index) => (
                <li key={index} style={{
                  padding: '10px',
                  marginBottom: '10px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  border: '1px solid #e9ecef'
                }}>
                  <strong>{event.title}</strong>
                  <br />
                  <small>{event.date}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <h4>Google Calendar連携について</h4>
        <p style={{ fontSize: '14px', color: '#666' }}>
          この機能を完全に動作させるには、Google Calendar APIの設定が必要です。<br />
          1. Google Cloud ConsoleでAPIキーを取得<br />
          2. カレンダーIDの設定<br />
          3. 認証の設定
        </p>
      </div>
    </div>
  );
};

export default GoogleCalendar; 