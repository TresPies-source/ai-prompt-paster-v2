import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DriveClient } from '@/services/drive/driveClient';
import { PromptService } from '@/services/drive/promptService';
import { ShareService } from '@/services/drive/shareService';
import {
  SharePromptRequest,
  SharePromptResponse,
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

    const body: SharePromptRequest = await request.json();

    if (body.expiresAt) {
      const expirationDate = new Date(body.expiresAt);
      const now = new Date();
      if (expirationDate <= now) {
        return NextResponse.json(
          { 
            error: 'Invalid expiration date',
            details: 'Expiration date must be in the future'
          } as ApiError,
          { status: 400 }
        );
      }
    }

    const driveClient = new DriveClient({ accessToken: session.accessToken });
    await driveClient.ensureAppFolderStructure();
    
    const promptService = new PromptService(driveClient);
    const shareService = new ShareService(driveClient);
    
    const prompt = await promptService.getPrompt(params.id);
    if (!prompt) {
      return NextResponse.json(
        { 
          error: 'Prompt not found',
          details: `Prompt with ID ${params.id} not found`
        } as ApiError,
        { status: 404 }
      );
    }

    const existingShare = await shareService.getShareByPromptId(params.id);
    if (existingShare) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const url = `${baseUrl}/share/${existingShare.token}`;
      
      const response: SharePromptResponse = {
        success: true,
        token: existingShare.token,
        url,
        expiresAt: existingShare.expiresAt,
      };

      return NextResponse.json(response);
    }

    const { share, url } = await shareService.createShare(
      params.id,
      prompt,
      {
        expiresAt: body.expiresAt,
        password: body.password,
      }
    );

    const response: SharePromptResponse = {
      success: true,
      token: share.token,
      url,
      expiresAt: share.expiresAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating share:', error);
    
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
        error: 'Failed to create share',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ApiError,
      { status: 500 }
    );
  }
}
