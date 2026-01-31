import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DriveClient } from '@/services/drive/driveClient';
import { CollectionService } from '@/services/drive/collectionService';
import {
  CreateCollectionRequest,
  CreateCollectionResponse,
  ListCollectionsResponse,
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
    
    const collectionService = new CollectionService(driveClient);
    
    const collections = await collectionService.listCollections();

    const response: ListCollectionsResponse = {
      collections,
      total: collections.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error listing collections:', error);
    return NextResponse.json(
      { 
        error: 'Failed to list collections',
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

    const body: CreateCollectionRequest = await request.json();

    const driveClient = new DriveClient({ accessToken: session.accessToken });
    await driveClient.ensureAppFolderStructure();
    
    const collectionService = new CollectionService(driveClient);
    
    const collection = await collectionService.createCollection({
      name: body.name,
      description: body.description,
      promptIds: body.promptIds,
    });

    const response: CreateCollectionResponse = { collection };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating collection:', error);
    
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
        error: 'Failed to create collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ApiError,
      { status: 500 }
    );
  }
}
