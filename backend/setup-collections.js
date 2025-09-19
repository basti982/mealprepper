/**
 * Script to create PocketBase collections
 * Run this after starting PocketBase
 */

const PB_URL = 'http://127.0.0.1:8090';

// Collection schemas
const collections = [
  {
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
  },
  {
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
        }
      },
      {
        name: 'servings',
        type: 'number',
        required: true,
        options: {
          min: 1,
          max: 20,
        }
      },
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: ''
  },
  {
    name: 'cooking_tasks',
    type: 'base',
    schema: [
      {
        name: 'session_id',
        type: 'relation',
        required: true,
        options: {
          collectionId: '', // Will be set after cooking_sessions is created
          cascadeDelete: true,
          minSelect: null,
          maxSelect: 1,
        }
      },
      {
        name: 'recipe_id',
        type: 'relation',
        required: true,
        options: {
          collectionId: '', // Will be set after recipes is created
          cascadeDelete: false,
          minSelect: null,
          maxSelect: 1,
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
        }
      },
      {
        name: 'order_priority',
        type: 'number',
        required: true,
        options: {
          min: 1,
          max: 99,
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
  }
];

async function setupCollections() {
  console.log('Setting up PocketBase collections...\n');

  console.log('📌 IMPORTANT: First create an admin account');
  console.log('1. Open: http://127.0.0.1:8090/_/');
  console.log('2. Create your admin account');
  console.log('3. Then run this script again with your credentials\n');

  console.log('Collections to create:');
  console.log('- cooking_sessions');
  console.log('- recipes');
  console.log('- cooking_tasks\n');

  console.log('You can create these manually in the PocketBase Admin UI:');
  console.log('1. Go to Collections');
  console.log('2. Click "New Collection"');
  console.log('3. Use the schema details from the SCHEMA.md file\n');

  // For now, just output curl commands that can be used
  console.log('Or use these API commands after logging in:\n');

  collections.forEach(col => {
    console.log(`Collection: ${col.name}`);
    console.log('Fields:');
    col.schema.forEach(field => {
      console.log(`  - ${field.name} (${field.type}${field.required ? ', required' : ''})`);
    });
    console.log('');
  });
}

setupCollections();