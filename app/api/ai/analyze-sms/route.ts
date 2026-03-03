import { NextRequest, NextResponse } from 'next/server'
import { analyzeSMS } from '@/lib/claude'

export async function POST(request: NextRequest) {
  try {
    const { message, leadContext } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      )
    }

    const analysis = await analyzeSMS(message, leadContext)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
