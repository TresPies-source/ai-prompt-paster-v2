import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DriveClient } from '@/services/drive/driveClient';
import { PromptService } from '@/services/drive/promptService';
import {
  RecordComparisonRequest,
  RecordComparisonResponse,
  ApiError,
} from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiError,
        { status: 401 }
      );
    }

    const body: RecordComparisonRequest = await request.json();

    if (!body.winnerId || body.winnerId.trim().length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          details: 'Winner ID is required'
        } as ApiError,
        { status: 400 }
      );
    }

    if (!body.loserIds || !Array.isArray(body.loserIds) || body.loserIds.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          details: 'At least one loser ID is required'
        } as ApiError,
        { status: 400 }
      );
    }

    if (body.loserIds.includes(body.winnerId)) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          details: 'Winner ID cannot be in the losers list'
        } as ApiError,
        { status: 400 }
      );
    }

    const driveClient = new DriveClient({ accessToken: session.accessToken });
    await driveClient.ensureAppFolderStructure();
    
    const promptService = new PromptService(driveClient);
    
    const result = await promptService.recordComparison(body.winnerId, body.loserIds);

    const calculateWinRate = (prompt: typeof result.winner | typeof result.losers[0]) => {
      const totalComparisons = (prompt.winCount || 0) + (prompt.lossCount || 0);
      return totalComparisons > 0 ? (prompt.winCount || 0) / totalComparisons : null;
    };

    const response: RecordComparisonResponse = {
      success: true,
      winner: {
        id: result.winner.id,
        winCount: result.winner.winCount || 0,
        winRate: calculateWinRate(result.winner),
      },
      losers: result.losers.map(loser => ({
        id: loser.id,
        lossCount: loser.lossCount || 0,
        winRate: calculateWinRate(loser),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error recording comparison:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { 
          error: 'Prompt not found',
          details: error.message
        } as ApiError,
        { status: 404 }
      );
    }

    if (error instanceof Error && (
      error.message.includes('Winner ID') ||
      error.message.includes('loser ID') ||
      error.message.includes('losers list')
    )) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          details: error.message
        } as ApiError,
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to record comparison',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ApiError,
      { status: 500 }
    );
  }
}
