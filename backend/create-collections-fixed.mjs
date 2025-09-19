import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function createCollections() {
  try {
    console.log('🔧 Creating PocketBase Collections (Fixed)...\n');

    // Authenticate as admin
    await pb.admins.authWithPassword('admin@example.com', 'adminpass123');
    console.log('✓ Admin authenticated');

    // Delete existing collections if any
    try {
      const existing = await pb.collections.getFullList();
      for (const col of existing) {
        if (['cooking_sessions', 'recipes', 'cooking_tasks'].includes(col.name)) {
          await pb.collections.delete(col.id);
          console.log(`✓ Deleted existing ${col.name}`);
        }
      }
    } catch (e) {
      console.log('No existing collections to delete');
    }

    console.log('\n📝 Creating collections with correct API format...\n');

    // Create recipes collection
    console.log('Creating recipes collection...');
    const recipesCollection = await pb.collections.create({
      name: 'recipes',
      type: 'base',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          options: {
            min: 1,
            max: 100
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
        }
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: ''
    });
    console.log('✓ Recipes collection created');

    // Create cooking_sessions collection
    console.log('Creating cooking_sessions collection...');
    const sessionsCollection = await pb.collections.create({
      name: 'cooking_sessions',
      type: 'base',
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true
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
            maxSelect: 1,
            values: ['planned', 'in_progress', 'completed']
          }
        }
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: ''
    });
    console.log('✓ Sessions collection created');

    // Create cooking_tasks collection
    console.log('Creating cooking_tasks collection...');
    const tasksCollection = await pb.collections.create({
      name: 'cooking_tasks',
      type: 'base',
      fields: [
        {
          name: 'session_id',
          type: 'relation',
          required: true,
          options: {
            collectionId: sessionsCollection.id,
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: null
          }
        },
        {
          name: 'recipe_id',
          type: 'relation',
          required: true,
          options: {
            collectionId: recipesCollection.id,
            cascadeDelete: false,
            minSelect: null,
            maxSelect: 1,
            displayFields: null
          }
        },
        {
          name: 'task_name',
          type: 'text',
          required: true,
          options: {
            min: 1,
            max: 100
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
            maxSelect: 1,
            values: ['oven', 'stovetop_1', 'stovetop_2', 'microwave', 'counter', 'fridge']
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
          required: false
        }
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: ''
    });
    console.log('✓ Tasks collection created');

    console.log('\n🧪 Testing collections with sample data...\n');

    // Test creating a recipe
    const testRecipe = await pb.collection('recipes').create({
      name: 'Test Roast Chicken',
      total_time: 90,
      servings: 4
    });
    console.log(`✅ Test recipe created: ${testRecipe.name} (${testRecipe.total_time}min, ${testRecipe.servings} servings)`);

    // Test creating a session
    const testSession = await pb.collection('cooking_sessions').create({
      date: new Date().toISOString().split('T')[0],
      duration_minutes: 180,
      status: 'planned'
    });
    console.log(`✅ Test session created: ${testSession.date} (${testSession.duration_minutes}min, ${testSession.status})`);

    // Test creating a task
    const testTask = await pb.collection('cooking_tasks').create({
      session_id: testSession.id,
      recipe_id: testRecipe.id,
      task_name: 'Prep chicken',
      duration_minutes: 15,
      appliance: 'counter',
      order_priority: 1,
      can_parallel: true
    });
    console.log(`✅ Test task created: ${testTask.task_name} (${testTask.appliance}, ${testTask.duration_minutes}min)`);

    console.log('\n🎉 SUCCESS! All collections created with proper schemas!');
    console.log('UI should now work at: http://localhost:5173/');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

createCollections();