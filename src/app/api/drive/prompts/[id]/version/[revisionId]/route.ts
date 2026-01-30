import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DriveClient } from '@/services/drive/driveClient';
import { PromptService } from '@/services/drive/promptService';
import { GetVersionResponse, ApiError } from '@/types/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; revisionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiError,
        { status: 401 }
      );
    }

    const driveClient = new DriveClient({ accessToken: session.accessToken });
    await driveClient.ensureAppFolderStructure();
    
    const promptService = new PromptService(driveClient);
    
    const content = await promptService.getPromptVersion(params.id, params.revisionId);

    const response: GetVersionResponse = {
      content,
      revisionId: params.revisionId
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching prompt version:', error);
    
    if (error instanceof Error && (error.message.includes('not found') || error.message.includes('Revision'))) {
      return NextResponse.json(
        { 
          error: 'Prompt or revision not found',
          details: error.message
        } as ApiError,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch prompt version',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ApiError,
      { status: 500 }
    );
  }
}
