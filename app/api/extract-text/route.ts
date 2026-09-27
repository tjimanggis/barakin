import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
const WordExtractor = require('word-extractor');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Konversi file ke Buffer secara eksplisit
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text = '';
    const fileName = file.name.toLowerCase();

    if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const result = await parser.getText();
        text = result.text.replace(/\n\n-- \d+ of \d+ --\n\n/g, '\n\n');
      } finally {
        await parser.destroy();
      }
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (file.type === 'application/msword' || fileName.endsWith('.doc')) {
      const extractor = new WordExtractor();
      const document = await extractor.extract(buffer);
      text = document.getBody();
    } else {
      return NextResponse.json({ error: 'Format tidak didukung. Unggah file PDF atau Word.' }, { status: 400 });
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: 'Teks tidak ditemukan. PDF hasil scan gambar belum dapat diekstrak.' },
        { status: 422 },
      );
    }

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('SERVER EXTRACTION ERROR:', error);
    return NextResponse.json({ 
      error: 'Gagal mengekstrak teks dari dokumen.',
      details: error.message || 'Kesalahan server yang tidak diketahui.',
    }, { status: 500 });
  }
}
