import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function fixCollections() {
  try {
    console.log('🔧 Fixing PocketBase Collections...\n');

    // Authenticate as admin
    await pb.admins.authWithPassword('admin@example.com', 'adminpass123');

    // Get existing collections
    const collections = await pb.collections.getFullList();

    // Delete existing problematic collections
    console.log('🗑️ Deleting existing collections...');
    for (const collection of collections) {
      if (['cooking_sessions', 'recipes', 'cooking_tasks'].includes(collection.name)) {
        await pb.collections.delete(collection.id);
        console.log(`   ✓ Deleted ${collection.name}`);
      }
    }

    console.log('\n📝 Creating collections with proper schemas...\n');

    // Create recipes collection with schema
    console.log('Creating recipes collection...');
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
    console.log('✓ Created recipes collection with schema');

    // Create cooking_sessions collection with schema
    console.log('Creating cooking_sessions collection...');
    const sessionsCollection = await pb.collections.create({
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
    console.log('✓ Created cooking_sessions collection with schema');

    // Create cooking_tasks collection with schema
    console.log('Creating cooking_tasks collection...');
    const tasksCollection = await pb.collections.create({
      name: 'cooking_tasks',
      type: 'base',
      schema: [
        {
          name: 'session_id',
          type: 'relation',
          required: true,
          options: {
            collectionId: sessionsCollection.id,
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
            collectionId: recipesCollection.id,
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
    console.log('✓ Created cooking_tasks collection with schema');

    console.log('\n🧪 Testing with proper schema...\n');

    // Test creating a recipe with data
    const testRecipe = await pb.collection('recipes').create({
      name: 'Test Chicken Recipe',
      total_time: 90,
      servings: 4
    });
    console.log('✅ Recipe created successfully:');
    console.log(`   Name: ${testRecipe.name}`);
    console.log(`   Time: ${testRecipe.total_time} minutes`);
    console.log(`   Servings: ${testRecipe.servings}`);

    // Test creating a session
    const testSession = await pb.collection('cooking_sessions').create({
      date: new Date().toISOString().split('T')[0],
      duration_minutes: 180,
      status: 'planned'
    });
    console.log('\n✅ Session created successfully:');
    console.log(`   Date: ${testSession.date}`);
    console.log(`   Duration: ${testSession.duration_minutes} minutes`);
    console.log(`   Status: ${testSession.status}`);

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
    console.log('\n✅ Task created successfully:');
    console.log(`   Name: ${testTask.task_name}`);
    console.log(`   Duration: ${testTask.duration_minutes} minutes`);
    console.log(`   Appliance: ${testTask.appliance}`);

    console.log('\n🎉 All collections fixed and working properly!');
    console.log('   You can now use the UI at http://localhost:5173/');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', error.response.data);
    }
  }
}

fixCollections();