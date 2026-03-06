import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateTemplate, validateTemplateRequest, getTemplateSuggestions } from '@/lib/canva-integration'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, useCase, templateRequest } = await request.json()

    if (action === 'suggestions') {
      if (!useCase) {
        return NextResponse.json(
          { error: 'Missing required field: useCase' },
          { status: 400 }
        )
      }

      const suggestions = getTemplateSuggestions(useCase)
      return NextResponse.json({ success: true, data: { suggestions } })
    }

    if (action === 'generate') {
      if (!templateRequest) {
        return NextResponse.json(
          { error: 'Missing required field: templateRequest' },
          { status: 400 }
        )
      }

      const validation = validateTemplateRequest(templateRequest)
      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Invalid template request', details: validation.errors },
          { status: 400 }
        )
      }

      const result = await generateTemplate(templateRequest)

      if (!result.success) {
        return NextResponse.json(
          { error: 'Failed to generate template', details: result.error },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data: result })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "suggestions" or "generate"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error handling Canva template request:', error)
    return NextResponse.json(
      { error: 'Failed to process request', details: (error as Error).message },
      { status: 500 }
    )
  }
}
