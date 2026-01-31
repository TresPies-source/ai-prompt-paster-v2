import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DriveClient } from '@/services/drive/driveClient';
import { ShareService } from '@/services/drive/shareService';
import {
  GetSharedPromptResponse,
  ApiError,
} from '@/types/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    if (!token || token.trim().length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid token',
          details: 'Token is required'
        } as ApiError,
        { status: 400 }
      );
    }

    let driveClient: DriveClient;

    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

    if (serviceAccountEmail && serviceAccountKey) {
      driveClient = new DriveClient({ 
        serviceAccount: {
          email: serviceAccountEmail,
          privateKey: serviceAccountKey.replace(/\\n/g, '\n'),
        }
      });
    } else {
      const session = await getServerSession(authOptions);
      
      if (!session?.accessToken) {
        return NextResponse.json(
          { 
            error: 'Service unavailable',
            details: 'Public sharing requires service account configuration or user authentication'
          } as ApiError,
          { status: 503 }
        );
      }

      driveClient = new DriveClient({ accessToken: session.accessToken });
    }

    await driveClient.ensureAppFolderStructure();
    
    const shareService = new ShareService(driveClient);
    const sharedPrompt = await shareService.getSharedPrompt(token);

    if (!sharedPrompt) {
      return NextResponse.json(
        { 
          error: 'Share not found',
          details: 'The shared prompt does not exist or has expired'
        } as ApiError,
        { status: 404 }
      );
    }

    const sanitizedPrompt = {
      id: sharedPrompt.prompt.id,
      title: sharedPrompt.prompt.title,
      content: sharedPrompt.prompt.content,
      tags: sharedPrompt.prompt.tags,
      createdAt: sharedPrompt.prompt.createdAt,
      modifiedAt: sharedPrompt.prompt.modifiedAt,
      isTemplate: sharedPrompt.prompt.isTemplate,
      variables: sharedPrompt.prompt.variables,
    };

    const response: GetSharedPromptResponse = {
      prompt: sanitizedPrompt as any,
      sharedAt: sharedPrompt.sharedAt,
      expiresAt: sharedPrompt.expiresAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error retrieving shared prompt:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve shared prompt',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ApiError,
      { status: 500 }
    );
  }
}
