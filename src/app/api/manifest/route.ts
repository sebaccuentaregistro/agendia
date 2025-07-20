// src/app/api/manifest/route.ts
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET() {
  try {
    // Construir la ruta al archivo manifest.json en la carpeta public
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    
    // Leer el contenido del archivo
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    
    // Parsear el JSON para asegurarse de que es válido
    const manifestJson = JSON.parse(manifestContent);

    // Devolver el contenido con los encabezados CORS correctos
    return new NextResponse(JSON.stringify(manifestJson), {
      status: 200,
      headers: {
        'Content-Type': 'application/manifest+json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error reading manifest file:', error);
    return new NextResponse('Manifest not found', { status: 404 });
  }
}
