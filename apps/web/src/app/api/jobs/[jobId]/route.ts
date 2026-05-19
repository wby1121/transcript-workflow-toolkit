import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET() {
  return NextResponse.json({ status: 'done', note: 'Job queue removed in v1 — using synchronous API' })
}
