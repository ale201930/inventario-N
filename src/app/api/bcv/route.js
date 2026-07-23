import { NextResponse } from 'next/server';
import { fetchBcvRate, setCustomBcvRate } from '@/lib/bcv';

export async function GET() {
  try {
    const rateData = await fetchBcvRate();
    return NextResponse.json(rateData);
  } catch (err) {
    return NextResponse.json({ error: 'Error obteniendo tasa BCV' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { tasa } = await request.json();
    if (!tasa || Number(tasa) <= 0) {
      return NextResponse.json({ error: 'Tasa inválida' }, { status: 400 });
    }
    const updated = setCustomBcvRate(tasa);
    return NextResponse.json({ success: true, rateData: updated });
  } catch (err) {
    return NextResponse.json({ error: 'Error actualizando tasa BCV' }, { status: 500 });
  }
}
