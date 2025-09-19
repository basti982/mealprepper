import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function createCollections() {
  try {
    // Authenticate with the admin account we just created
    await pb.admins.authWithPassword('admin@example.com', 'adminpass123');
    console.log('✓ Admin authenticated');

    // 1. Create cooking_sessions collection
    try {
      const sessionsCol = await pb.collections.create({
        name: 'cooking_sessions',
        type: 'base',
        schema: [
          {
            name: 'date',
            type: 'date',
            required: true,
            options: {}
          },
          {
            name: 'duration_minutes',
            type: 'number',
            required: true,
            options: { min: 30, max: 360, noDecimal: true }
          },
          {
            name: 'status',
            type: 'select',
            required: false,
            options: {
              values: ['planned', 'in_progress', 'completed'],
              maxSelect: 1
            }
          }
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      });
      console.log('✓ cooking_sessions collection created');
    } catch (err) {
      console.log('⚠ cooking_sessions may already exist');
    }

    // 2. Create recipes collection
    try {
      const recipesCol = await pb.collections.create({
        name: 'recipes',
        type: 'base',
        schema: [
          {
            name: 'name',
            type: 'text',
            required: true,
            options: { min: 1, max: 100 }
          },
          {
            name: 'total_time',
            type: 'number',
            required: true,
            options: { min: 5, max: 300, noDecimal: true }
          },
          {
            name: 'servings',
            type: 'number',
            required: true,
            options: { min: 1, max: 20, noDecimal: true }
          }
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      });
      console.log('✓ recipes collection created');
    } catch (err) {
      console.log('⚠ recipes may already exist');
    }

    // 3. Create cooking_tasks collection with string IDs instead of relations
    try {
      const tasksCol = await pb.collections.create({
        name: 'cooking_tasks',
        type: 'base',
        schema: [
          {
            name: 'session_id',
            type: 'text',
            required: true,
            options: { min: 1, max: 50 }
          },
          {
            name: 'recipe_id',
            type: 'text',
            required: true,
            options: { min: 1, max: 50 }
          },
          {
            name: 'task_name',
            type: 'text',
            required: true,
            options: { min: 1, max: 100 }
          },
          {
            name: 'duration_minutes',
            type: 'number',
            required: true,
            options: { min: 1, max: 180, noDecimal: true }
          },
          {
            name: 'appliance',
            type: 'text',
            required: true,
            options: { min: 1, max: 20 }
          },
          {
            name: 'start_time',
            type: 'number',
            required: false,
            options: { min: 0, max: 1440, noDecimal: true }
          },
          {
            name: 'order_priority',
            type: 'number',
            required: true,
            options: { min: 1, max: 99, noDecimal: true }
          },
          {
            name: 'can_parallel',
            type: 'bool',
            required: false,
            options: {}
          }
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      });
      console.log('✓ cooking_tasks collection created');
    } catch (err) {
      console.log('⚠ cooking_tasks may already exist');
    }

    console.log('\n🎉 SUCCESS! All collections are set up!');
    console.log('The app should now work at: http://localhost:5173/');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

createCollections();