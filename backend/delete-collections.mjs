import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function deleteCollections() {
  try {
    await pb.admins.authWithPassword('admin@example.com', 'adminpass123');
    console.log('✓ Admin authenticated');

    const collections = await pb.collections.getFullList();

    for (const col of collections) {
      if (['recipes', 'cooking_sessions', 'cooking_tasks'].includes(col.name)) {
        await pb.collections.delete(col.id);
        console.log(`✓ Deleted ${col.name}`);
      }
    }

    console.log('✓ All collections deleted');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

deleteCollections();