import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function createCollectionsStepByStep() {
  try {
    await pb.admins.authWithPassword('admin@example.com', 'adminpass123');
    console.log('✓ Admin authenticated');

    // Step 1: Create base collections without relations
    console.log('\n1. Creating base collections...');

    const recipesCol = await pb.collections.create({
      name: 'recipes',
      type: 'base',
      fields: [
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
    console.log('✓ Recipes collection created');

    const sessionsCol = await pb.collections.create({
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
          options: { min: 30, max: 360, noDecimal: true }
        },
        {
          name: 'status',
          type: 'text',
          required: true,
          options: { min: 1, max: 20 }
        }
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: ''
    });
    console.log('✓ Sessions collection created');

    // Step 2: Create tasks collection with relations
    console.log('\n2. Creating tasks collection with relations...');

    const tasksCol = await pb.collections.create({
      name: 'cooking_tasks',
      type: 'base',
      fields: [
        {
          name: 'session_id',
          type: 'relation',
          required: true,
          options: {
            collectionId: sessionsCol.id,
            cascadeDelete: true,
            maxSelect: 1,
            minSelect: null,
            displayFields: null
          }
        },
        {
          name: 'recipe_id',
          type: 'relation',
          required: true,
          options: {
            collectionId: recipesCol.id,
            cascadeDelete: false,
            maxSelect: 1,
            minSelect: null,
            displayFields: null
          }
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

    // Step 3: Test with sample data
    console.log('\n3. Testing with sample data...');

    const recipe = await pb.collection('recipes').create({
      name: 'Test Recipe',
      total_time: 60,
      servings: 4
    });
    console.log(`✓ Test recipe: ${recipe.name}`);

    const session = await pb.collection('cooking_sessions').create({
      date: new Date().toISOString().split('T')[0],
      duration_minutes: 120,
      status: 'planned'
    });
    console.log(`✓ Test session: ${session.date}`);

    const task = await pb.collection('cooking_tasks').create({
      session_id: session.id,
      recipe_id: recipe.id,
      task_name: 'Prep ingredients',
      duration_minutes: 15,
      appliance: 'counter',
      order_priority: 1,
      can_parallel: true
    });
    console.log(`✓ Test task: ${task.task_name}`);

    console.log('\n🎉 SUCCESS! All collections created and tested!');
    console.log('UI should now work at: http://localhost:5173/');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

createCollectionsStepByStep();