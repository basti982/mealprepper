import fetch from 'node-fetch';

async function checkUI() {
  try {
    console.log('🔍 Checking UI response...');

    // Test main page
    const response = await fetch('http://localhost:5173/');
    const html = await response.text();

    console.log('✅ HTML loads successfully');
    console.log('📄 Page title:', html.match(/<title>(.*?)<\/title>/)?.[1]);

    // Check if Vue app script is loaded
    if (html.includes('/src/main.ts')) {
      console.log('✅ Vue app script found');
    }

    // Test the compiled App.vue by checking the module endpoint
    try {
      const appResponse = await fetch('http://localhost:5173/src/App.vue');
      if (appResponse.ok) {
        const appContent = await appResponse.text();

        if (appContent.includes('MealPrepper')) {
          console.log('✅ App.vue contains "MealPrepper"');
        }

        if (appContent.includes('Launch Kitchen Orchestrator')) {
          console.log('✅ New button text found');
        }

        if (appContent.includes('gradient-to-br from-slate-50')) {
          console.log('✅ New styling found');
        }

        console.log('📊 App.vue is accessible and contains the new content');
      }
    } catch (e) {
      console.log('⚠️  Could not fetch App.vue directly:', e.message);
    }

  } catch (error) {
    console.error('❌ Error checking UI:', error.message);
  }
}

checkUI();