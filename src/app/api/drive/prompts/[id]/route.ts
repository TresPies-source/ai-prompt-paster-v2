import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DriveClient } from '@/services/drive/driveClient';
import { PromptService } from '@/services/drive/promptService';
import {
  UpdatePromptRequest,
  UpdatePromptResponse,
  DeletePromptResponse,
  ApiError,
} from '@/types/api';

export async function PUT(
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

    const body: UpdatePromptRequest = await request.json();

    const driveClient = new DriveClient({ accessToken: session.accessToken });
    await driveClient.ensureAppFolderStructure();
    
    const promptService = new PromptService(driveClient);
    
    const prompt = await promptService.updatePrompt(params.id, body);

    const response: UpdatePromptResponse = { prompt };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating prompt:', error);
    
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
        error: 'Failed to update prompt',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ApiError,
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    
    const success = await promptService.deletePrompt(params.id);

    if (!success) {
      return NextResponse.json(
        { 
          error: 'Prompt not found'
        } as ApiError,
        { status: 404 }
      );
    }

    const response: DeletePromptResponse = { success: true };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete prompt',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ApiError,
      { status: 500 }
    );
  }
}
