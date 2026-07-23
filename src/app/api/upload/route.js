import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') || formData.get('image') || formData.get('imagen');

    if (!file || typeof file !== 'object') {
      return NextResponse.json({ error: 'No se recibió ningún archivo de imagen' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const ext = path.extname(file.name || 'image.jpg') || '.jpg';
    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
    const uploadPath = path.join(uploadsDir, filename);

    await writeFile(uploadPath, buffer);

    return NextResponse.json({ 
      success: true, 
      url: `/uploads/${filename}` 
    });
  } catch (err) {
    console.error('Error en /api/upload:', err);
    return NextResponse.json({ error: 'Error procesando subida de imagen: ' + err.message }, { status: 500 });
  }
}
