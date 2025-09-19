import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Simple script to create collections using the HTTP API directly
async function createCollections() {
  try {
    // First authenticate as admin
    await pb.admins.authWithPassword('admin@example.com', 'adminpass123');
    console.log('✓ Authenticated as admin');

    // Create collections by sending requests to the collections API
    const collections = [
      {
        name: 'recipes',
        type: 'base',
        schema: [
          { name: 'name', type: 'text', required: true, options: { min: 1, max: 100 } },
          { name: 'total_time', type: 'number', required: true, options: { min: 5, max: 300, noDecimal: true } },
          { name: 'servings', type: 'number', required: true, options: { min: 1, max: 20, noDecimal: true } }
        ]
      },
      {
        name: 'cooking_sessions',
        type: 'base',
        schema: [
          { name: 'date', type: 'date', required: true, options: {} },
          { name: 'duration_minutes', type: 'number', required: true, options: { min: 30, max: 360, noDecimal: true } },
          { name: 'status', type: 'text', required: true, options: { min: 1, max: 20 } }
        ]
      },
      {
        name: 'cooking_tasks',
        type: 'base',
        schema: [
          { name: 'session_id', type: 'text', required: true, options: { min: 1, max: 50 } },
          { name: 'recipe_id', type: 'text', required: true, options: { min: 1, max: 50 } },
          { name: 'task_name', type: 'text', required: true, options: { min: 1, max: 100 } },
          { name: 'duration_minutes', type: 'number', required: true, options: { min: 1, max: 180, noDecimal: true } },
          { name: 'appliance', type: 'text', required: true, options: { min: 1, max: 20 } },
          { name: 'start_time', type: 'number', required: false, options: { min: 0, max: 1440, noDecimal: true } },
          { name: 'order_priority', type: 'number', required: true, options: { min: 1, max: 99, noDecimal: true } },
          { name: 'can_parallel', type: 'bool', required: false, options: {} }
        ]
      }
    ];

    // Try to create each collection
    for (const col of collections) {
      try {
        // Set API rules to allow access
        const collectionData = {
          ...col,
          listRule: '',
          viewRule: '',
          createRule: '',
          updateRule: '',
          deleteRule: ''
        };

        const response = await fetch('http://127.0.0.1:8090/api/collections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': pb.authStore.token
          },
          body: JSON.stringify(collectionData)
        });

        if (response.ok) {
          console.log(`✓ Created collection: ${col.name}`);
        } else {
          const error = await response.text();
          console.log(`⚠ Failed to create ${col.name}: ${error}`);
        }
      } catch (err) {
        console.log(`⚠ Error creating ${col.name}: ${err.message}`);
      }
    }

    console.log('\n✅ Setup complete! Testing API access...');

    // Test by listing collections
    try {
      const collections = await pb.collections.getFullList();
      console.log(`Found ${collections.length} collections`);
      collections.forEach(c => console.log(`  - ${c.name}`));
    } catch (err) {
      console.log('Could not list collections:', err.message);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

createCollections();