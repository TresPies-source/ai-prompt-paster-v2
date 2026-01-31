import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '@/types/api';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Client-side only operation',
      details:
        'AI prompt refinement uses WebLLM which requires WebGPU and runs in the browser. ' +
        'Call aiService.refinePrompt() directly from React components instead of using this API route. ' +
        'This route exists for documentation purposes only.',
    } as ApiError,
    { status: 501 }
  );
}
