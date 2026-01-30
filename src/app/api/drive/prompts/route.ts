import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DriveClient } from '@/services/drive/driveClient';
import { PromptService } from '@/services/drive/promptService';
import {
  CreatePromptRequest,
  CreatePromptResponse,
  ListPromptsRequest,
  ListPromptsResponse,
  ApiError,
} from '@/types/api';
import { validatePrompt } from '@/types/prompt';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiError,
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const folderPath = searchParams.get('folderPath') || undefined;
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',') : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    const driveClient = new DriveClient({ accessToken: session.accessToken });
    await driveClient.ensureAppFolderStructure();
    
    const promptService = new PromptService(driveClient);
    
    const allPrompts = await promptService.listPrompts({ folderPath, tags });
    
    const total = allPrompts.length;
    const start = offset || 0;
    const end = limit ? start + limit : allPrompts.length;
    const prompts = allPrompts.slice(start, end);
    const hasMore = end < total;

    const response: ListPromptsResponse = {
      prompts,
      total,
      hasMore,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error listing prompts:', error);
    return NextResponse.json(
      { 
        error: 'Failed to list prompts',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ApiError,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiError,
        { status: 401 }
      );
    }

    const body: CreatePromptRequest = await request.json();

    const validationErrors = validatePrompt(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationErrors.join(', ')
        } as ApiError,
        { status: 400 }
      );
    }

    const driveClient = new DriveClient({ accessToken: session.accessToken });
    await driveClient.ensureAppFolderStructure();
    
    const promptService = new PromptService(driveClient);
    
    const prompt = await promptService.createPrompt({
      title: body.title,
      content: body.content,
      tags: body.tags,
      folderPath: body.folderPath,
      sourceUrl: body.sourceUrl,
    });

    const response: CreatePromptResponse = { prompt };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating prompt:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create prompt',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ApiError,
      { status: 500 }
    );
  }
}
