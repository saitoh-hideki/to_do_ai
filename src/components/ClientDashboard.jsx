import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function ClientDashboard() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // 名簿一覧を取得
  const fetchClients = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setClients(data);
    } catch (err) {
      setError('名簿の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 初回マウント時に一覧取得
  React.useEffect(() => {
    fetchClients();
  }, []);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError('');
    try {
      console.log('Uploading file:', selectedFile.name);
      // uidを使わず、ファイル名のみで保存
      const fileExt = selectedFile.name.split('.').pop();
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const fileName = `${uniqueId}.${fileExt}`;
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
      const response = await fetch('https://akevbwjhvjblwedeoanw.functions.supabase.co/business-card', {
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
      setSelectedFile(null);
      alert('アップロード・登録が完了しました');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', background: '#fff', padding: 32, borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}>
      <h2 style={{ color: '#333', marginBottom: 24, fontSize: 24, fontWeight: 'bold' }}>取引先名簿ダッシュボード</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <input type="file" accept="application/pdf,image/jpeg,image/jpg" onChange={handleFileChange} disabled={uploading} />
        <button onClick={handleUpload} disabled={!selectedFile || uploading} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: uploading ? '#6c757d' : '#007bff', color: '#fff', fontWeight: 'bold', fontSize: 16, cursor: uploading ? 'not-allowed' : 'pointer' }}>
          {uploading ? 'アップロード中...' : 'アップロード'}
        </button>
        {selectedFile && <span style={{ marginLeft: 12, color: '#555' }}>{selectedFile.name}</span>}
      </div>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      <h3 style={{ color: '#222', marginBottom: 12, fontSize: 20, fontWeight: 'bold' }}>名簿一覧</h3>
      {loading ? (
        <div style={{ fontSize: 18, color: '#666', textAlign: 'center', margin: 32 }}>読み込み中...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fafbfc' }}>
            <thead>
              <tr style={{ background: '#f1f3f6' }}>
                <th style={{ padding: 10, border: '1px solid #e0e0e0', color: '#111' }}>会社名</th>
                <th style={{ padding: 10, border: '1px solid #e0e0e0', color: '#111' }}>担当者</th>
                <th style={{ padding: 10, border: '1px solid #e0e0e0', color: '#111' }}>メール</th>
                <th style={{ padding: 10, border: '1px solid #e0e0e0', color: '#111' }}>電話</th>
                <th style={{ padding: 10, border: '1px solid #e0e0e0', color: '#111' }}>住所</th>
                <th style={{ padding: 10, border: '1px solid #e0e0e0', color: '#111' }}>登録日</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <tr key={client.id}>
                  <td style={{ padding: 10, border: '1px solid #e0e0e0', color: '#111' }}>{client.company_name}</td>
                  <td style={{ padding: 10, border: '1px solid #e0e0e0', color: '#111' }}>{client.person_name}</td>
                  <td style={{ padding: 10, border: '1px solid #e0e0e0', color: '#111' }}>{client.email}</td>
                  <td style={{ padding: 10, border: '1px solid #e0e0e0', color: '#111' }}>{client.phone}</td>
                  <td style={{ padding: 10, border: '1px solid #e0e0e0', color: '#111' }}>{client.address}</td>
                  <td style={{ padding: 10, border: '1px solid #e0e0e0', color: '#111' }}>{new Date(client.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ClientDashboard; 