import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function createTasksCollection() {
  try {
    await pb.admins.authWithPassword('admin@example.com', 'adminpass123');
    console.log('✓ Admin authenticated');

    // Create tasks collection with string references instead of relations
    const tasksCol = await pb.collections.create({
      name: 'cooking_tasks',
      type: 'base',
      fields: [
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

    // Test with sample data
    const recipe = await pb.collection('recipes').create({
      name: 'Test Recipe',
      total_time: 60,
      servings: 4
    });

    const session = await pb.collection('cooking_sessions').create({
      date: new Date().toISOString().split('T')[0],
      duration_minutes: 120,
      status: 'planned'
    });

    const task = await pb.collection('cooking_tasks').create({
      session_id: session.id,
      recipe_id: recipe.id,
      task_name: 'Prep ingredients',
      duration_minutes: 15,
      appliance: 'counter',
      order_priority: 1,
      can_parallel: true
    });

    console.log(`✓ Sample data created:`);
    console.log(`  Recipe: ${recipe.name} (${recipe.total_time}min)`);
    console.log(`  Session: ${session.date} (${session.duration_minutes}min)`);
    console.log(`  Task: ${task.task_name} (${task.appliance})`);

    console.log('\n🎉 SUCCESS! All collections created and working!');
    console.log('UI should now work at: http://localhost:5173/');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

createTasksCollection();