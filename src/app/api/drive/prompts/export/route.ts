import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DriveClient } from '@/services/drive/driveClient';
import { PromptService } from '@/services/drive/promptService';
import { ExportRequest, ExportResponse, ApiError } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiError,
        { status: 401 }
      );
    }

    const body: ExportRequest = await request.json();

    if (!body.promptIds || body.promptIds.length === 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: 'promptIds is required and must not be empty'
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
    
    const content = await promptService.exportPrompts(body.promptIds, body.format);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = body.format === 'json' 
      ? `prompts-export-${timestamp}.json`
      : `prompts-export-${timestamp}.md`;
    const mimeType = body.format === 'json'
      ? 'application/json'
      : 'text/markdown';

    const response: ExportResponse = {
      content,
      filename,
      mimeType
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error exporting prompts:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { 
          error: 'One or more prompts not found',
          details: error.message
        } as ApiError,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to export prompts',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ApiError,
      { status: 500 }
    );
  }
}
