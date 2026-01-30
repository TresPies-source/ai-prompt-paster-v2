import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DriveClient } from '@/services/drive/driveClient';
import { PromptService } from '@/services/drive/promptService';
import { TrackViewResponse, ApiError } from '@/types/api';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    
    const result = await promptService.trackPromptView(params.id);

    const response: TrackViewResponse = {
      success: true,
      viewCount: result.viewCount,
      lastUsedAt: result.lastUsedAt
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error tracking prompt view:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { 
          error: 'Prompt not found',
          details: error.message
        } as ApiError,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to track prompt view',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ApiError,
      { status: 500 }
    );
  }
}
