import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function checkCollections() {
  try {
    // Authenticate as admin
    await pb.admins.authWithPassword('admin@example.com', 'adminpass123');

    console.log('📋 Current Collections:\n');

    const collections = await pb.collections.getFullList();

    for (const collection of collections) {
      if (['cooking_sessions', 'recipes', 'cooking_tasks'].includes(collection.name)) {
        console.log(`📁 ${collection.name} (${collection.type})`);
        console.log(`   ID: ${collection.id}`);
        console.log('   Schema:');

        if (collection.schema && collection.schema.length > 0) {
          for (const field of collection.schema) {
            console.log(`     - ${field.name} (${field.type}${field.required ? ', required' : ''})`);
          }
        } else {
          console.log('     ❌ No schema fields defined!');
        }
        console.log('');
      }
    }

    // Test creating a record to see what happens
    console.log('🧪 Testing record creation...\n');

    try {
      const testRecord = await pb.collection('recipes').create({
        name: 'Debug Test Recipe',
        total_time: 45,
        servings: 2
      });
      console.log('✓ Test record created successfully');
      console.log('   Data:', testRecord);
    } catch (err) {
      console.log('❌ Test record creation failed:');
      console.log('   Error:', err.message);
      if (err.response?.data) {
        console.log('   Details:', JSON.stringify(err.response.data, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCollections();