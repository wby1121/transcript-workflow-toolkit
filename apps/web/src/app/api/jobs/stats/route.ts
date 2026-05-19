import { NextResponse } from 'next/server'
import { getJobStats } from '@/lib/queue/job-creator'
import { checkProviderHealth } from '@/providers/registry'

export async function GET() {
  const stats = getJobStats()
  const providerHealth = await checkProviderHealth()

  return NextResponse.json({
    ...stats,
    providers: providerHealth,
    uptime: process.uptime(),
  })
}
