import { chromium } from '@playwright/test';

async function testUI() {
  console.log('Starting UI test...');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('Console Error:', msg.text());
    }
  });

  page.on('pageerror', err => {
    errors.push(err.toString());
    console.log('Page Error:', err.toString());
  });

  try {
    // Test 1: Load the main page
    console.log('\n1. Loading main page...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('   ✓ Page loaded');

    // Check for main elements
    const title = await page.textContent('h1');
    console.log(`   Title found: "${title}"`);

    // Test 2: Look for the button
    console.log('\n2. Looking for View Kitchen Timeline button...');
    const button = await page.getByRole('button', { name: /View Kitchen Timeline|Get Started/i });
    if (await button.count() > 0) {
      console.log('   ✓ Button found');

      // Test 3: Click the button
      console.log('\n3. Clicking button...');
      await button.click();
      console.log('   ✓ Button clicked');

      // Wait for navigation/change
      await page.waitForTimeout(1000);

      // Check what's visible now
      const h2Elements = await page.locator('h2').allTextContents();
      console.log(`   H2 elements found: ${h2Elements.join(', ')}`);

      // Test 4: Check for orchestration elements
      console.log('\n4. Checking for orchestration UI...');
      const addRecipeBtn = await page.getByRole('button', { name: /Recipe/i });
      const addTaskBtn = await page.getByRole('button', { name: /Task/i });

      if (await addRecipeBtn.count() > 0) {
        console.log('   ✓ Add Recipe button found');
      }
      if (await addTaskBtn.count() > 0) {
        console.log('   ✓ Add Task button found');
      }

      // Test 5: Try to add a recipe
      console.log('\n5. Testing Add Recipe...');
      if (await addRecipeBtn.count() > 0) {
        await addRecipeBtn.click();
        console.log('   ✓ Add Recipe clicked');

        // Check if form appeared
        const nameInput = await page.locator('input[placeholder*="Recipe name"]');
        if (await nameInput.count() > 0) {
          console.log('   ✓ Recipe form opened');
        }
      }

    } else {
      console.log('   ✗ Button not found - page might not be loading correctly');
    }

    // Report errors
    if (errors.length > 0) {
      console.log('\n❌ JavaScript Errors Found:');
      errors.forEach((err, i) => console.log(`   ${i+1}. ${err}`));
    } else {
      console.log('\n✅ No JavaScript errors detected');
    }

    // Take screenshot
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('\n📸 Screenshot saved as test-screenshot.png');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('📸 Error screenshot saved as error-screenshot.png');
  }

  await browser.close();
  console.log('\n✅ Test completed');
}

testUI().catch(console.error);