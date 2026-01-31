import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DriveClient } from '@/services/drive/driveClient';
import { PromptService } from '@/services/drive/promptService';
import {
  MarkSuccessRequest,
  MarkSuccessResponse,
  ApiError,
} from '@/types/api';

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

    const body: MarkSuccessRequest = await request.json();

    if (typeof body.success !== 'boolean') {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          details: 'success field must be a boolean'
        } as ApiError,
        { status: 400 }
      );
    }

    const driveClient = new DriveClient({ accessToken: session.accessToken });
    await driveClient.ensureAppFolderStructure();
    
    const promptService = new PromptService(driveClient);
    
    const result = await promptService.markSuccess(params.id, body.success);

    const response: MarkSuccessResponse = {
      success: true,
      successCount: result.successCount,
      failureCount: result.failureCount,
      successRate: result.successRate,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error marking success:', error);
    
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
        error: 'Failed to mark success',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ApiError,
      { status: 500 }
    );
  }
}
