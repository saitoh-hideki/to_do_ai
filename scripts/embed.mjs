import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';

// --- 環境変数チェック ---
if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !process.env.OPENAI_API_KEY) {
  throw new Error("必要な環境変数が設定されていません。'VITE_SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'OPENAI_API_KEY' を .env ファイルに設定してください。");
}

// --- クライアント初期化 ---
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// テキストファイルを読み込む関数
function loadDocumentsFromFiles() {
  const documentsDir = path.join(process.cwd(), 'documents');
  const documents = [];
  
  if (!fs.existsSync(documentsDir)) {
    console.log('documents フォルダが見つかりません。');
    return documents;
  }
  
  const files = fs.readdirSync(documentsDir).filter(file => file.endsWith('.txt'));
  
  for (const file of files) {
    const filePath = path.join(documentsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(file, '.txt');
    
    documents.push({
      content: content,
      metadata: { 
        source: 'internal-document',
        filename: fileName,
        type: 'company-document'
      }
    });
    
    console.log(`- ${fileName}.txt を読み込みました (${content.length} 文字)`);
  }
  
  return documents;
}

async function main() {
  console.log("社内文書のベクトル化と保存を開始します...");
  
  // テキストファイルからドキュメントを読み込み
  const documents = loadDocumentsFromFiles();
  
  if (documents.length === 0) {
    console.log("処理するドキュメントが見つかりません。documents フォルダに .txt ファイルを配置してください。");
    return;
  }

  try {
    for (const doc of documents) {
      console.log(`- 「${doc.content.substring(0, 50)}...」を処理中...`);

      // 1. OpenAI APIでベクトル化 (Embedding)
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: doc.content,
      });
      const embedding = embeddingResponse.data[0].embedding;

      // 2. Supabaseに保存
      const { data, error } = await supabase
        .from('documents')
        .insert({
          content: doc.content,
          embedding: embedding,
          metadata: doc.metadata
        });

      if (error) {
        console.error(`  - 保存エラー: ${error.message}`);
      } else {
        console.log(`  - 保存完了`);
      }
    }
    console.log("すべてのドキュメントの処理が完了しました。");

  } catch (error) {
    console.error("処理中にエラーが発生しました:", error);
  }
}

main(); 