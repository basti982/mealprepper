import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function testCreate() {
  try {
    // Try to authenticate as admin - this should work if admin exists
    await pb.admins.authWithPassword('admin@example.com', 'adminpass123');
    console.log('✅ Admin authenticated');

    // Try creating collection with select field
    const testCol = await pb.collections.create({
      name: 'test_select',
      type: 'base',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true
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
    console.log('✅ Select collection created:', testCol.name);

    // Clean up
    await pb.collections.delete(testCol.id);
    console.log('✅ Test collection deleted');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCreate();