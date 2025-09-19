import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function createCollections() {
  try {
    // Authenticate as admin
    console.log('Authenticating as admin...');
    await pb.admins.authWithPassword('admin@example.com', 'adminpass123');
    console.log('✓ Authenticated');

    // Check existing collections
    const existingCollections = await pb.collections.getFullList();
    const existingNames = existingCollections.map(c => c.name);
    console.log('Existing collections:', existingNames);

    // Create cooking_sessions collection
    if (!existingNames.includes('cooking_sessions')) {
      console.log('\nCreating cooking_sessions collection...');
      const cookingSessionsCollection = await pb.collections.create({
        name: 'cooking_sessions',
        type: 'base',
        schema: [
          {
            name: 'date',
            type: 'date',
            required: true,
          },
          {
            name: 'duration_minutes',
            type: 'number',
            required: true,
            options: {
              min: 30,
              max: 360,
              noDecimal: true
            }
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            options: {
              values: ['planned', 'in_progress', 'completed'],
            }
          },
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      });
      console.log('✓ Created cooking_sessions');
    } else {
      console.log('✓ cooking_sessions already exists');
    }

    // Create recipes collection
    if (!existingNames.includes('recipes')) {
      console.log('\nCreating recipes collection...');
      const recipesCollection = await pb.collections.create({
        name: 'recipes',
        type: 'base',
        schema: [
          {
            name: 'name',
            type: 'text',
            required: true,
            options: {
              min: 1,
              max: 100,
            }
          },
          {
            name: 'total_time',
            type: 'number',
            required: true,
            options: {
              min: 5,
              max: 300,
              noDecimal: true
            }
          },
          {
            name: 'servings',
            type: 'number',
            required: true,
            options: {
              min: 1,
              max: 20,
              noDecimal: true
            }
          },
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      });
      console.log('✓ Created recipes');
    } else {
      console.log('✓ recipes already exists');
    }

    // Get collection IDs for relations
    const allCollections = await pb.collections.getFullList();
    const sessionsId = allCollections.find(c => c.name === 'cooking_sessions')?.id;
    const recipesId = allCollections.find(c => c.name === 'recipes')?.id;

    // Create cooking_tasks collection
    if (!existingNames.includes('cooking_tasks')) {
      console.log('\nCreating cooking_tasks collection...');
      const cookingTasksCollection = await pb.collections.create({
        name: 'cooking_tasks',
        type: 'base',
        schema: [
          {
            name: 'session_id',
            type: 'relation',
            required: true,
            options: {
              collectionId: sessionsId,
              cascadeDelete: true,
              minSelect: null,
              maxSelect: 1,
              displayFields: []
            }
          },
          {
            name: 'recipe_id',
            type: 'relation',
            required: true,
            options: {
              collectionId: recipesId,
              cascadeDelete: false,
              minSelect: null,
              maxSelect: 1,
              displayFields: []
            }
          },
          {
            name: 'task_name',
            type: 'text',
            required: true,
            options: {
              min: 1,
              max: 100,
            }
          },
          {
            name: 'duration_minutes',
            type: 'number',
            required: true,
            options: {
              min: 1,
              max: 180,
              noDecimal: true
            }
          },
          {
            name: 'appliance',
            type: 'select',
            required: true,
            options: {
              values: ['oven', 'stovetop_1', 'stovetop_2', 'microwave', 'counter', 'fridge'],
            }
          },
          {
            name: 'start_time',
            type: 'number',
            required: false,
            options: {
              min: 0,
              max: 1440,
              noDecimal: true
            }
          },
          {
            name: 'order_priority',
            type: 'number',
            required: true,
            options: {
              min: 1,
              max: 99,
              noDecimal: true
            }
          },
          {
            name: 'can_parallel',
            type: 'bool',
            required: false,
          },
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      });
      console.log('✓ Created cooking_tasks');
    } else {
      console.log('✓ cooking_tasks already exists');
    }

    console.log('\n✅ All collections created successfully!');
    console.log('You can now use the app at http://localhost:5173/');

  } catch (error) {
    console.error('Error:', error.message || error);
    if (error.response?.data) {
      console.error('Details:', error.response.data);
    }
  }
}

createCollections();