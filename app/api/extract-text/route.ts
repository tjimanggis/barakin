import { NextRequest, NextResponse } from 'next/server';
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';

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

    // Deteksi tipe file
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      // Opsi untuk pdf-parse agar lebih stabil
      const data = await pdfParse(buffer, { pagerender: () => '' });
      text = data.text;
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.toLowerCase().endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Only PDF or DOCX allowed.' }, { status: 400 });
    }

    return NextResponse.json({ text });
  } catch (error: any) {
    // Log detail error ke server log
    console.error('SERVER EXTRACTION ERROR:', error);
    return NextResponse.json({ 
      error: 'Failed to extract text', 
      details: error.message || 'Unknown server error' 
    }, { status: 500 });
  }
}
