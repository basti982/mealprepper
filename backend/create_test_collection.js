// Script to create a test collection in PocketBase via API
// Note: You need to create an admin account first via the setup URL

const createTestCollection = async () => {
  const baseUrl = 'http://127.0.0.1:8090';

  // Collection schema for a "recipes" test collection
  const collectionData = {
    name: 'recipes',
    type: 'base',
    schema: [
      {
        name: 'title',
        type: 'text',
        required: true,
        options: {
          min: 1,
          max: 200
        }
      },
      {
        name: 'description',
        type: 'text',
        required: false,
        options: {
          min: 0,
          max: 1000
        }
      },
      {
        name: 'prep_time',
        type: 'number',
        required: false,
        options: {
          min: 0,
          max: 999
        }
      },
      {
        name: 'servings',
        type: 'number',
        required: false,
        options: {
          min: 1,
          max: 20
        }
      },
      {
        name: 'ingredients',
        type: 'json',
        required: false
      },
      {
        name: 'instructions',
        type: 'editor',
        required: false
      }
    ],
    listRule: '',  // Allow public list access
    viewRule: '',  // Allow public view access
    createRule: '@request.auth.id != ""',  // Only authenticated users can create
    updateRule: '@request.auth.id != ""',  // Only authenticated users can update
    deleteRule: '@request.auth.id != ""'   // Only authenticated users can delete
  };

  console.log('Test Collection Schema:');
  console.log('========================');
  console.log('Collection Name: recipes');
  console.log('Type: base');
  console.log('Fields:');
  console.log('  - title (text, required)');
  console.log('  - description (text)');
  console.log('  - prep_time (number, in minutes)');
  console.log('  - servings (number)');
  console.log('  - ingredients (json array)');
  console.log('  - instructions (rich text editor)');
  console.log('');
  console.log('Access Rules:');
  console.log('  - Public can view and list');
  console.log('  - Authenticated users can create/update/delete');
  console.log('');
  console.log('Note: To actually create this collection:');
  console.log('1. Open PocketBase Admin: http://127.0.0.1:8090/_/');
  console.log('2. Create your admin account using the setup URL provided when PocketBase started');
  console.log('3. Go to Collections and create a new collection with the schema above');
  console.log('');
  console.log('API Endpoints that will be available:');
  console.log(`  GET    ${baseUrl}/api/collections/recipes/records`);
  console.log(`  GET    ${baseUrl}/api/collections/recipes/records/:id`);
  console.log(`  POST   ${baseUrl}/api/collections/recipes/records`);
  console.log(`  PATCH  ${baseUrl}/api/collections/recipes/records/:id`);
  console.log(`  DELETE ${baseUrl}/api/collections/recipes/records/:id`);
};

createTestCollection();