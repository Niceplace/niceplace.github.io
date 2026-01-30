import puppeteer from 'puppeteer';

// Test locally by serving the file
async function testLocal(): Promise<void> {
    console.log('Testing local file...\n');

    const browser = await puppeteer.launch({ headless: false }); // Use visible mode for debugging
    const page = await browser.newPage();

    // Capture ALL console messages
    const consoleMessages: any[] = [];
    page.on('console', (msg) => {
        consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            location: msg.location(),
        });
    });

    try {
        // Load the local file
        const fileUrl = 'file:///Users/simonbeaulieu/workspace/personal/niceplace.github.io/index.html';
        console.log(`Loading: ${fileUrl}\n`);

        await page.goto(fileUrl, {
            waitUntil: 'networkidle0',
            timeout: 10000,
        });

        // Wait for scene to initialize
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('=== Console Messages ===');
        consoleMessages.forEach(msg => {
            const icon = {
                'error': '✗',
                'warning': '⚠',
                'log': '•',
                'info': 'ℹ',
            }[msg.type] || '?';
            console.log(`${icon} [${msg.type.toUpperCase()}] ${msg.text}`);
        });

        // Take a screenshot
        await page.screenshot({ path: 'screenshot.png', fullPage: false });
        console.log('\nScreenshot saved to screenshot.png');

        // Check canvas
        const canvasExists = await page.evaluate(() => {
            const canvas = document.getElementById('myCanvas');
            if (!canvas) return false;

            // Check if WebGL context exists
            const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
            return !!gl;
        });

        console.log(`\n✓ Canvas with WebGL context: ${canvasExists}`);

        const errors = consoleMessages.filter(m => m.type === 'error');
        if (errors.length > 0) {
            console.log(`\n✗ ${errors.length} error(s) found`);
            process.exit(1);
        } else {
            console.log('\n✓ No errors in console');
        }

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testLocal().catch(console.error);
