import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DriveClient } from '@/services/drive/driveClient';
import { ShareService } from '@/services/drive/shareService';
import { PromptService } from '@/services/drive/promptService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const token = searchParams.get('token');

    const driveClient = new DriveClient({ accessToken: session.accessToken });
    await driveClient.ensureAppFolderStructure();
    
    const shareService = new ShareService(driveClient);
    const promptService = new PromptService(driveClient);

    if (action === 'test-all') {
      const results: any[] = [];
      
      try {
        results.push({ step: 'Creating test prompt...' });
        const prompt = await promptService.createPrompt({
          title: 'Test Prompt for Sharing',
          content: 'This is a test prompt to verify share functionality',
          tags: ['test', 'share'],
          folderPath: '/test',
        });
        results.push({ step: 'Created prompt', data: prompt });

        results.push({ step: 'Creating share...' });
        const { share, url } = await shareService.createShare(prompt.id, prompt);
        results.push({ 
          step: 'Created share', 
          data: { 
            token: share.token,
            url,
            promptId: share.promptId,
            createdAt: share.createdAt,
          }
        });

        results.push({ step: 'Verifying token is unique...' });
        results.push({ step: 'Token generated', token: share.token, tokenLength: share.token.length });

        results.push({ step: 'Retrieving shared prompt by token...' });
        const sharedPrompt = await shareService.getSharedPrompt(share.token);
        results.push({ 
          step: 'Retrieved shared prompt', 
          success: !!sharedPrompt,
          data: sharedPrompt ? {
            promptTitle: sharedPrompt.prompt.title,
            sharedAt: sharedPrompt.sharedAt,
          } : null
        });

        results.push({ step: 'Testing invalid token...' });
        const invalidToken = await shareService.getSharedPrompt('invalid-token-12345');
        results.push({ 
          step: 'Invalid token test', 
          success: invalidToken === null,
          data: invalidToken
        });

        results.push({ step: 'Testing getShareByPromptId...' });
        const shareByPromptId = await shareService.getShareByPromptId(prompt.id);
        results.push({ 
          step: 'Retrieved share by prompt ID', 
          success: !!shareByPromptId,
          data: shareByPromptId
        });

        results.push({ step: 'Creating share with expiration...' });
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const { share: expiringShare } = await shareService.createShare(prompt.id, prompt, {
          expiresAt: futureDate.toISOString(),
        });
        results.push({ 
          step: 'Created expiring share', 
          data: {
            token: expiringShare.token,
            expiresAt: expiringShare.expiresAt,
          }
        });

        results.push({ step: 'Verifying expiring share is accessible...' });
        const expiringSharedPrompt = await shareService.getSharedPrompt(expiringShare.token);
        results.push({ 
          step: 'Retrieved expiring shared prompt', 
          success: !!expiringSharedPrompt,
          expiresAt: expiringSharedPrompt?.expiresAt
        });

        results.push({ step: 'Testing expired share...' });
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        const { share: expiredShare } = await shareService.createShare(prompt.id, prompt, {
          expiresAt: pastDate.toISOString(),
        });
        const expiredSharedPrompt = await shareService.getSharedPrompt(expiredShare.token);
        results.push({ 
          step: 'Expired share test', 
          success: expiredSharedPrompt === null,
          data: expiredSharedPrompt
        });

        results.push({ step: 'Cleaning up - deleting shares...' });
        await shareService.deleteShare(share.token);
        await shareService.deleteShare(expiringShare.token);
        await shareService.deleteShare(expiredShare.token);
        results.push({ step: 'Deleted all test shares' });

        results.push({ step: 'Cleaning up - deleting test prompt...' });
        await promptService.deletePrompt(prompt.id);
        results.push({ step: 'Deleted test prompt' });

        return NextResponse.json({ 
          success: true, 
          message: 'All tests passed!',
          results 
        });
      } catch (error) {
        results.push({ 
          step: 'Error during test', 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        return NextResponse.json({ 
          success: false, 
          message: 'Test failed',
          results 
        }, { status: 500 });
      }
    }

    if (action === 'get' && token) {
      const sharedPrompt = await shareService.getSharedPrompt(token);
      if (!sharedPrompt) {
        return NextResponse.json({ error: 'Share not found or expired' }, { status: 404 });
      }
      return NextResponse.json({ sharedPrompt });
    }

    return NextResponse.json({ 
      message: 'ShareService test endpoint',
      usage: {
        testAll: '/api/drive/test-shares?action=test-all',
        get: '/api/drive/test-shares?action=get&token=<share-token>',
      }
    });

  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
