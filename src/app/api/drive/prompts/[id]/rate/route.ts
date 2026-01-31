import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DriveClient } from '@/services/drive/driveClient';
import { PromptService } from '@/services/drive/promptService';
import {
  AddRatingRequest,
  AddRatingResponse,
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

    const body: AddRatingRequest = await request.json();

    if (!body.rating || !Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { 
          error: 'Invalid rating',
          details: 'Rating must be an integer between 1 and 5'
        } as ApiError,
        { status: 400 }
      );
    }

    const driveClient = new DriveClient({ accessToken: session.accessToken });
    await driveClient.ensureAppFolderStructure();
    
    const promptService = new PromptService(driveClient);
    
    const result = await promptService.addRating(params.id, body.rating);

    const response: AddRatingResponse = {
      success: true,
      averageRating: result.averageRating > 0 ? result.averageRating : null,
      totalRatings: result.totalRatings,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error adding rating:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { 
          error: 'Prompt not found',
          details: error.message
        } as ApiError,
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message.includes('Rating must be')) {
      return NextResponse.json(
        { 
          error: 'Invalid rating',
          details: error.message
        } as ApiError,
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to add rating',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ApiError,
      { status: 500 }
    );
  }
}
