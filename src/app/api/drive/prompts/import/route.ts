import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DriveClient } from '@/services/drive/driveClient';
import { PromptService } from '@/services/drive/promptService';
import { ImportRequest, ImportResponse, ApiError } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiError,
        { status: 401 }
      );
    }

    const body: ImportRequest = await request.json();

    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: 'content is required and must be a string'
        } as ApiError,
        { status: 400 }
      );
    }

    if (!['json', 'markdown'].includes(body.format)) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: 'format must be either "json" or "markdown"'
        } as ApiError,
        { status: 400 }
      );
    }

    const driveClient = new DriveClient({ accessToken: session.accessToken });
    await driveClient.ensureAppFolderStructure();
    
    const promptService = new PromptService(driveClient);
    
    const result = await promptService.importPrompts(body.content, body.format);

    const response: ImportResponse = {
      prompts: result.prompts,
      imported: result.imported,
      failed: result.failed,
      errors: result.errors
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error importing prompts:', error);
    
    if (error instanceof Error && error.message.includes('Invalid')) {
      return NextResponse.json(
        { 
          error: 'Invalid import data',
          details: error.message
        } as ApiError,
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to import prompts',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ApiError,
      { status: 500 }
    );
  }
}
