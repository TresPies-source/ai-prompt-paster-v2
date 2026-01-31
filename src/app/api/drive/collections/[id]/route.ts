import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DriveClient } from '@/services/drive/driveClient';
import { CollectionService } from '@/services/drive/collectionService';
import {
  UpdateCollectionRequest,
  UpdateCollectionResponse,
  ApiError,
} from '@/types/api';
import { PromptCollection } from '@/types/prompt';

export async function GET(
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
    
    const collectionService = new CollectionService(driveClient);
    
    const collection = await collectionService.getCollection(params.id);

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' } as ApiError,
        { status: 404 }
      );
    }

    return NextResponse.json({ collection });
  } catch (error) {
    console.error('Error getting collection:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ApiError,
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const body: UpdateCollectionRequest = await request.json();

    const driveClient = new DriveClient({ accessToken: session.accessToken });
    await driveClient.ensureAppFolderStructure();
    
    const collectionService = new CollectionService(driveClient);
    
    const collection = await collectionService.updateCollection(params.id, body);

    const response: UpdateCollectionResponse = { collection };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating collection:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { 
          error: 'Collection not found',
          details: error.message
        } as ApiError,
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message.includes('Validation failed')) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.message
        } as ApiError,
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to update collection',
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
    
    const collectionService = new CollectionService(driveClient);
    
    const success = await collectionService.deleteCollection(params.id);

    if (!success) {
      return NextResponse.json(
        { 
          error: 'Collection not found'
        } as ApiError,
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ApiError,
      { status: 500 }
    );
  }
}
