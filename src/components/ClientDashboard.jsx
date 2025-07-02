import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import MusicGenDashboard from "./MusicGenDashboard";

// Supabaseクライアントを直接初期化
const supabaseUrl = 'https://akevbwjhvjblwedeoanw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrZXZid2podmpibHdlZGVvYW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MjIzMzUsImV4cCI6MjA2NjA5ODMzNX0.GoPxEWO6GlONSS7CxLd4Hi-uM90-0-M0aRzM8sHF4Vo';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function ClientDashboard() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = React.useState("main");

  // 名簿一覧を取得
  const fetchClients = async () => {
    setError('');
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      setError('名簿の取得に失敗しました');
    }
  };

  // 初回マウント時に一覧取得
  useEffect(() => {
    fetchClients();
  }, []);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // ファイル選択をリセット
  const resetFileInput = () => {
    setSelectedFile(null);
    // input要素をリセット
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError('');
    try {
      console.log('Uploading file:', selectedFile.name);
      // ファイル名にタイムスタンプを追加して重複を回避
      const fileExt = selectedFile.name.split('.').pop();
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const fileName = `${timestamp}-${randomId}.${fileExt}`;
      const filePath = fileName;
      console.log('File path:', filePath);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('business-cards')
        .upload(filePath, selectedFile);
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }
      console.log('Storage upload successful');
      
      // Edge Function呼び出し
      console.log('Calling Edge Function...');
      const response = await fetch('https://akevbwjhvjblwedeoanw.supabase.co/functions/v1/business-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrZXZid2podmpibHdlZGVvYW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MjIzMzUsImV4cCI6MjA2NjA5ODMzNX0.GoPxEWO6GlONSS7CxLd4Hi-uM90-0-M0aRzM8sHF4Vo',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrZXZid2podmpibHdlZGVvYW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MjIzMzUsImV4cCI6MjA2NjA5ODMzNX0.GoPxEWO6GlONSS7CxLd4Hi-uM90-0-M0aRzM8sHF4Vo',
        },
        body: JSON.stringify({ file_path: filePath }),
      });
      
      console.log('Edge Function response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge Function error response:', errorText);
        throw new Error(`AI連携API呼び出しに失敗しました (${response.status}): ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Edge Function success:', result);
      
      await fetchClients();
      resetFileInput(); // ファイル選択をリセット
      alert('アップロード・登録が完了しました');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, width: '100%', boxSizing: 'border-box', margin: "20px auto", padding: 16, borderRadius: 12 }}>
      {tab === "main" && (
        <div style={{ 
          width: '100%', 
          boxSizing: 'border-box',
          padding: window.innerWidth <= 768 ? '16px' : '24px', 
          borderRadius: 16, 
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)'
        }}>
          <h2 style={{ 
            color: '#333', 
            marginBottom: window.innerWidth <= 768 ? '16px' : '20px', 
            fontSize: window.innerWidth <= 768 ? '20px' : '24px', 
            fontWeight: 'bold'
          }}>取引先名簿ダッシュボード</h2>
          
          {/* アップロードフォーム */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: window.innerWidth <= 768 ? '12px' : '16', 
            marginBottom: window.innerWidth <= 768 ? '16px' : '20px',
            flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
            width: '100%', 
            boxSizing: 'border-box'
          }}>
            <input 
              type="file" 
              accept="application/pdf,image/jpeg,image/jpg" 
              onChange={handleFileChange} 
              disabled={uploading}
              style={{
                width: window.innerWidth <= 768 ? '100%' : 'auto'
              }}
            />
            <button 
              className="btn-3d"
              onClick={handleUpload} 
              disabled={!selectedFile || uploading} 
            >
              {uploading ? 'アップロード中...' : 'アップロード'}
            </button>
            {selectedFile && (
              <>
                <span style={{ 
                  marginLeft: window.innerWidth <= 768 ? '0' : '12', 
                  color: '#333',
                  fontSize: window.innerWidth <= 768 ? '14px' : '16px'
                }}>{selectedFile.name}</span>
                <button 
                  onClick={resetFileInput}
                  disabled={uploading}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#6c757d',
                    color: '#fff',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  リセット
                </button>
              </>
            )}
          </div>
          
          {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}
          
          {/* 名簿一覧 */}
          <h3 style={{ marginTop: 32, marginBottom: 12, color: '#333' }}>名簿一覧</h3>
          {loading ? (
            <div style={{ 
              fontSize: 18, 
              color: '#333', 
              textAlign: 'center', 
              margin: 32
            }}>読み込み中...</div>
          ) : (
            <div style={{ 
              overflowX: "auto", 
              maxHeight: 500, 
              overflowY: 'auto', 
              width: '100%', 
              boxSizing: 'border-box' 
            }}>
              <table style={{ 
                width: "100%", 
                minWidth: 800, 
                borderCollapse: "collapse", 
                boxSizing: 'border-box', 
                color: '#fff' 
              }}>
                <thead>
                  <tr>
                    <th style={{ padding: "12px", border: "1px solid #e0e0e0", color: "#fff", backgroundColor: "#2a2a2a" }}>会社名</th>
                    <th style={{ padding: "12px", border: "1px solid #e0e0e0", color: "#fff", backgroundColor: "#2a2a2a" }}>担当者</th>
                    <th style={{ padding: "12px", border: "1px solid #e0e0e0", color: "#fff", backgroundColor: "#2a2a2a" }}>メール</th>
                    <th style={{ padding: "12px", border: "1px solid #e0e0e0", color: "#fff", backgroundColor: "#2a2a2a" }}>電話</th>
                    <th style={{ padding: "12px", border: "1px solid #e0e0e0", color: "#fff", backgroundColor: "#2a2a2a" }}>住所</th>
                    <th style={{ padding: "12px", border: "1px solid #e0e0e0", color: "#fff", backgroundColor: "#2a2a2a" }}>登録日</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: 20, color: "#fff" }}>保存された名簿はありません</td></tr>
                  ) : (
                    clients.map(client => (
                      <tr key={client.id}>
                        <td style={{ padding: 12, border: "1px solid #e0e0e0", color: "#fff" }}>{client.company_name}</td>
                        <td style={{ padding: 12, border: "1px solid #e0e0e0", color: "#fff" }}>{client.person_name}</td>
                        <td style={{ padding: 12, border: "1px solid #e0e0e0", color: "#fff" }}>{client.email}</td>
                        <td style={{ padding: 12, border: "1px solid #e0e0e0", color: "#fff" }}>{client.phone}</td>
                        <td style={{ padding: 12, border: "1px solid #e0e0e0", color: "#fff" }}>{client.address}</td>
                        <td style={{ padding: 12, border: "1px solid #e0e0e0", color: "#fff" }}>{new Date(client.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {tab === "music" && (
        <MusicGenDashboard />
      )}
    </div>
  );
}

export default ClientDashboard; 