import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

function CompanySearchDashboard() {
  const [companyName, setCompanyName] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [savedCompanies, setSavedCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [enterKeyCount, setEnterKeyCount] = useState(0);

  // DBから会社リスト取得
  const fetchCompanies = async () => {
    setError("");
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSavedCompanies(data || []);
    } catch (err) {
      setError("会社リストの取得に失敗しました");
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Edge Function経由で会社情報検索
  const handleSearch = async () => {
    if (!companyName.trim()) return;
    setLoading(true);
    setError("");
    setSearchResult(null);
    try {
      // クラウドのEdge Functionエンドポイントを直接呼び出す
      const res = await fetch(
        "https://akevbwjhvjblwedeoanw.supabase.co/functions/v1/company-search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrZXZid2podmpibHdlZGVvYW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MjIzMzUsImV4cCI6MjA2NjA5ODMzNX0.GoPxEWO6GlONSS7CxLd4Hi-uM90-0-M0aRzM8sHF4Vo",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrZXZid2podmpibHdlZGVvYW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MjIzMzUsImV4cCI6MjA2NjA5ODMzNX0.GoPxEWO6GlONSS7CxLd4Hi-uM90-0-M0aRzM8sHF4Vo"
          },
          body: JSON.stringify({ companyName }),
        }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Edge Function returned a non-2xx status code");
      }
      const data = await res.json();
      setSearchResult(data);
    } catch (err) {
      setError("会社情報の取得に失敗しました: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Supabaseに保存
  const handleSave = async () => {
    if (!searchResult) return;
    setSaving(true);
    setError("");
    try {
      console.log("保存開始:", searchResult);
      const { data, error } = await supabase.from("companies").insert({
        name: searchResult.name,
        business: searchResult.business || "",
        ceo: searchResult.ceo,
        established: searchResult.established,
        philosophy: searchResult.philosophy,
        summary: searchResult.summary
      });
      console.log("保存結果:", { data, error });
      if (error) throw error;
      console.log("保存成功");
      // 保存後に検索結果をクリアして会社リストを更新
      setSearchResult(null);
      setCompanyName("");
      fetchCompanies();
    } catch (err) {
      console.error("保存エラー:", err);
      setError("保存に失敗しました: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 削除
  const handleDelete = async (id) => {
    setError("");
    try {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
      fetchCompanies();
    } catch (err) {
      setError("削除に失敗しました");
    }
  };

  // フィールドラベルを取得する関数
  const getFieldLabel = (key) => {
    const labels = {
      name: '会社名',
      business: '事業内容',
      ceo: '代表者名',
      established: '設立年月日',
      philosophy: '企業理念・ビジョン',
      summary: '企業概要'
    };
    return labels[key] || key;
  };

  // 会社名が保存済みかどうか判定
  const isAlreadySaved = () => {
    if (!searchResult) return false;
    return savedCompanies.some(c => c.name === searchResult.name);
  };

  return (
    <div style={{ maxWidth: 900, width: '100%', boxSizing: 'border-box', margin: "2rem auto", padding: 24, borderRadius: 12 }}>
      {/* 検索フォーム */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, width: '100%', boxSizing: 'border-box' }}>
        <input
          type="text"
          value={companyName}
          onChange={e => setCompanyName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              if (enterKeyCount === 0 && !loading && companyName.trim()) {
                setEnterKeyCount(1);
              } else if (enterKeyCount === 1 && !loading && companyName.trim()) {
                handleSearch();
                setEnterKeyCount(0);
              }
            }
          }}
          placeholder="会社名を入力"
          style={{ flex: 1, padding: 12, fontSize: 16, borderRadius: 8, border: "1px solid #ccc", width: '100%', boxSizing: 'border-box' }}
        />
        <button
          className="btn-3d"
          onClick={handleSearch}
          disabled={loading || !companyName.trim()}
        >
          {loading ? "検索中..." : "検索"}
        </button>
        {searchResult && (
          <button
            onClick={handleSave}
            disabled={saving || isAlreadySaved()}
            className="btn-3d"
            style={{ 
              backgroundColor: isAlreadySaved() ? '#666' : '#4CAF50',
              opacity: isAlreadySaved() ? 0.5 : 1,
              cursor: isAlreadySaved() ? 'not-allowed' : 'pointer'
            }}
          >
            {isAlreadySaved() ? "保存済み" : saving ? "保存中..." : "保存"}
          </button>
        )}
      </div>
      {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}
      
      {/* 検索結果表示 */}
      {searchResult && (
        <>
          <div style={{ 
            padding: 20, 
            borderRadius: 8, 
            marginBottom: 16, 
            width: '100%', 
            boxSizing: 'border-box',
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid rgba(255,255,255,0.2)',
            backgroundColor: 'rgba(255,255,255,0.85)'
          }}>
            <h3 style={{ color: '#111', marginTop: 0 }}>検索結果</h3>
            <p style={{color: '#111'}}><strong>会社名:</strong> {searchResult.name}</p>
            <p style={{color: '#111'}}><strong>事業内容:</strong> {searchResult.business}</p>
            <p style={{color: '#111'}}><strong>代表者名:</strong> {searchResult.ceo}</p>
            <p style={{color: '#111'}}><strong>設立年月日:</strong> {searchResult.established}</p>
            <p style={{color: '#111'}}><strong>企業理念・ビジョン:</strong> {searchResult.philosophy}</p>
            <p style={{color: '#111'}}><strong>企業概要:</strong> {searchResult.summary}</p>
            {searchResult.sources && Object.keys(searchResult.sources).length > 0 && (
              <div style={{ marginTop: 12 }}>
                <span style={{ color: '#111', fontWeight: 'bold' }}>検索元:</span>
                <ul style={{ color: '#111', margin: '6px 0 0 0', paddingLeft: 18, fontSize: 13 }}>
                  {Object.entries(searchResult.sources).map(([key, value]) => {
                    const renderUrl = (url, idx) => {
                      const isValidUrl = typeof url === 'string' && url.match(/^https?:\/\//);
                      return (
                        <li key={key + '-' + idx}>
                          <span>{key}: </span>
                          {isValidUrl ? (
                            <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', wordBreak: 'break-all' }}>{url}</a>
                          ) : (
                            <span style={{ color: '#888' }}>{url || 'URLなし'}</span>
                          )}
                        </li>
                      );
                    };
                    if (Array.isArray(value)) {
                      return value.map((url, idx) => renderUrl(url, idx));
                    } else if (typeof value === 'object' && value !== null) {
                      return Object.values(value).map((url, idx) => renderUrl(url, 'obj-' + idx));
                    } else {
                      return renderUrl(value, '');
                    }
                  })}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* 保存済み会社リスト */}
      <h3 style={{ marginTop: 32, marginBottom: 12, color: '#111' }}>保存済み会社リスト</h3>
      <div style={{ overflowX: "auto", maxHeight: 500, overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
        <table style={{ width: "100%", minWidth: 800, borderCollapse: "collapse", boxSizing: 'border-box', color: '#fff' }}>
          <thead>
            <tr>
              <th style={{ padding: "12px", border: "1px solid #e0e0e0", color: "#fff", backgroundColor: "#2a2a2a" }}>会社名</th>
              <th style={{ padding: "12px", border: "1px solid #e0e0e0", color: "#fff", backgroundColor: "#2a2a2a" }}>事業内容</th>
              <th style={{ padding: "12px", border: "1px solid #e0e0e0", color: "#fff", backgroundColor: "#2a2a2a" }}>代表者名</th>
              <th style={{ padding: "12px", border: "1px solid #e0e0e0", color: "#fff", backgroundColor: "#2a2a2a" }}>設立年月日</th>
              <th style={{ padding: "12px", border: "1px solid #e0e0e0", color: "#fff", backgroundColor: "#2a2a2a" }}>企業理念・ビジョン</th>
              <th style={{ padding: "12px", border: "1px solid #e0e0e0", color: "#fff", backgroundColor: "#2a2a2a" }}>企業概要</th>
              <th style={{ padding: "12px", border: "1px solid #e0e0e0", color: "#fff", backgroundColor: "#2a2a2a" }}></th>
            </tr>
          </thead>
          <tbody>
            {savedCompanies.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 20, color: "#fff" }}>保存された会社はありません</td></tr>
            ) : (
              savedCompanies.map((c, i) => (
                <tr key={c.id}>
                  <td style={{ padding: 12, border: "1px solid #e0e0e0", color: "#fff" }}>{c.name}</td>
                  <td style={{ padding: 12, border: "1px solid #e0e0e0", color: "#fff" }}>{c.business}</td>
                  <td style={{ padding: 12, border: "1px solid #e0e0e0", color: "#fff" }}>{c.ceo}</td>
                  <td style={{ padding: 12, border: "1px solid #e0e0e0", color: "#fff" }}>{c.established}</td>
                  <td style={{ padding: 12, border: "1px solid #e0e0e0", color: "#fff" }}>{c.philosophy}</td>
                  <td style={{ padding: 12, border: "1px solid #e0e0e0", color: "#fff" }}>{c.summary}</td>
                  <td style={{ padding: 12, border: "1px solid #e0e0e0" }}>
                    <button onClick={() => handleDelete(c.id)} className="btn-3d" style={{ background: "#dc3545" }}>削除</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CompanySearchDashboard; 