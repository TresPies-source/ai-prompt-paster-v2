import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DriveClient } from '@/services/drive/driveClient';
import { FolderService } from '@/services/drive/folderService';
import { PromptService } from '@/services/drive/promptService';
import {
  CreateFolderRequest,
  CreateFolderResponse,
  ListFoldersResponse,
  ApiError,
} from '@/types/api';

export async function GET(request: NextRequest) {
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
    
    const folderService = new FolderService(driveClient);
    const promptService = new PromptService(driveClient);

    const prompts = await promptService.listPrompts();
    const folders = await folderService.rebuildFolderTree(prompts);

    const response: ListFoldersResponse = { folders };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error listing folders:', error);
    return NextResponse.json(
      { 
        error: 'Failed to list folders',
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

    const body: CreateFolderRequest = await request.json();

    if (!body.name || !body.parentPath) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: 'Name and parentPath are required'
        } as ApiError,
        { status: 400 }
      );
    }

    const driveClient = new DriveClient({ accessToken: session.accessToken });
    await driveClient.ensureAppFolderStructure();
    
    const folderService = new FolderService(driveClient);
    
    const folder = await folderService.createFolder(body.name, body.parentPath);

    const response: CreateFolderResponse = { folder };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating folder:', error);
    
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { 
          error: 'Folder already exists',
          details: error.message
        } as ApiError,
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to create folder',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ApiError,
      { status: 500 }
    );
  }
}
