import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DriveClient } from '@/services/drive/driveClient';
import { CollectionService } from '@/services/drive/collectionService';

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
    const id = searchParams.get('id');

    const driveClient = new DriveClient({ accessToken: session.accessToken });
    await driveClient.ensureAppFolderStructure();
    
    const collectionService = new CollectionService(driveClient);

    if (action === 'test-all') {
      const results: any[] = [];
      
      try {
        results.push({ step: 'Creating test collection...' });
        const collection = await collectionService.createCollection({
          name: 'Test Collection',
          description: 'This is a test collection',
          promptIds: ['test-prompt-1', 'test-prompt-2'],
        });
        results.push({ step: 'Created collection', data: collection });

        results.push({ step: 'Retrieving collection...' });
        const retrieved = await collectionService.getCollection(collection.id);
        results.push({ step: 'Retrieved collection', data: retrieved });

        results.push({ step: 'Listing all collections...' });
        const list = await collectionService.listCollections();
        results.push({ step: 'Listed collections', count: list.length, data: list });

        results.push({ step: 'Updating collection...' });
        const updated = await collectionService.updateCollection(collection.id, {
          name: 'Updated Test Collection',
          description: 'Updated description',
        });
        results.push({ step: 'Updated collection', data: updated });

        results.push({ step: 'Deleting collection...' });
        const deleted = await collectionService.deleteCollection(collection.id);
        results.push({ step: 'Deleted collection', success: deleted });

        results.push({ step: 'Verifying deletion...' });
        const afterDelete = await collectionService.getCollection(collection.id);
        results.push({ step: 'After deletion', data: afterDelete });

        return NextResponse.json({ 
          success: true, 
          message: 'All tests passed!',
          results 
        });
      } catch (error) {
        results.push({ 
          step: 'Error during test', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        return NextResponse.json({ 
          success: false, 
          message: 'Test failed',
          results 
        }, { status: 500 });
      }
    }

    if (action === 'list') {
      const collections = await collectionService.listCollections();
      return NextResponse.json({ collections });
    }

    if (action === 'get' && id) {
      const collection = await collectionService.getCollection(id);
      if (!collection) {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
      }
      return NextResponse.json({ collection });
    }

    return NextResponse.json({ 
      message: 'CollectionService test endpoint',
      usage: {
        testAll: '/api/drive/test-collections?action=test-all',
        list: '/api/drive/test-collections?action=list',
        get: '/api/drive/test-collections?action=get&id=<collection-id>',
      }
    });

  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
