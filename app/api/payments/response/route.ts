import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // ePayco redirects here after payment — send user back to panel
  return NextResponse.redirect(new URL('/panel', req.url))
}