import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('kiosk-branch')?.value || null;
  return NextResponse.json({ kioskBranchCookie: cookie });
}


