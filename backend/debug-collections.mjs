import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function debug() {
  try {
    await pb.admins.authWithPassword('admin@example.com', 'adminpass123');
    console.log('✓ Admin authenticated');

    const collections = await pb.collections.getFullList();
    console.log('\nExisting collections:');
    collections.forEach(col => {
      console.log(`- ${col.name} (ID: ${col.id})`);
    });

    // Try creating a simple collection with a relation to the recipes collection
    const recipesCol = collections.find(c => c.name === 'recipes');
    if (recipesCol) {
      console.log(`\nTrying relation to recipes collection (ID: ${recipesCol.id})`);

      const testCol = await pb.collections.create({
        name: 'test_relation',
        type: 'base',
        fields: [
          {
            name: 'recipe_ref',
            type: 'relation',
            required: true,
            options: {
              collectionId: recipesCol.id,
              maxSelect: 1
            }
          }
        ]
      });
      console.log('✓ Test relation collection created');

      // Clean up
      await pb.collections.delete(testCol.id);
      console.log('✓ Test collection deleted');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

debug();