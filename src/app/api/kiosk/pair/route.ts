import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchCode = (searchParams.get('branch') || '').toUpperCase();
    const key = searchParams.get('key') || req.headers.get('x-setup-key') || '';

    if (!process.env.KIOSK_SETUP_KEY || key !== process.env.KIOSK_SETUP_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!branchCode) {
      return NextResponse.json({ error: 'Missing branch parameter' }, { status: 400 });
    }

    const branch = await db.branch.findUnique({ where: { code: branchCode } });
    if (!branch || !branch.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive branch' }, { status: 400 });
    }

    const res = NextResponse.json({ message: 'Kiosk paired', branch: { code: branch.code, name: branch.name } });
    res.cookies.set('kiosk-branch', branch.code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // Без истечения срока: сессионная кука превращаем в "постоянную" через очень большой срок
      maxAge: 60 * 60 * 24 * 365 * 100, // ~100 лет
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


