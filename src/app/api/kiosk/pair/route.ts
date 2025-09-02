import { NextRequest, NextResponse } from 'next/server';

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

    const res = NextResponse.json({ message: 'Kiosk paired', branch: { code: branchCode } });
    res.cookies.set('kiosk-branch', branchCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365 * 100,
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


