import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET() {
  return NextResponse.json({ pending: 0, processing: 0, failed: 0, failedToday: 0, note: 'Job queue removed in v1 — using synchronous API' })
}
