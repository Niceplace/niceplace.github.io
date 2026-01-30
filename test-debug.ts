import puppeteer from 'puppeteer';

async function testLocalFile(): Promise<void> {
    console.log('Testing local file with debug output...\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Capture console output
    page.on('console', (msg) => {
        console.log(`[CONSOLE] ${msg.text()}`);
    });

    page.on('pageerror', (error) => {
        console.log(`[PAGE ERROR] ${error.message}`);
    });

    try {
        const fileUrl = 'file:///Users/simonbeaulieu/workspace/personal/niceplace.github.io/index.html';
        console.log(`Loading: ${fileUrl}\n`);

        await page.goto(fileUrl, {
            waitUntil: 'networkidle0',
            timeout: 30000,
        });

        console.log('\nPage loaded. Waiting 3 seconds for scene initialization...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Get scene info from page
        const sceneInfo = await page.evaluate(() => {
            const canvas = document.getElementById('myCanvas');
            return {
                canvasExists: !!canvas,
                canvasWidth: canvas?.width,
                canvasHeight: canvas?.height,
                canvasStyle: canvas ? getComputedStyle(canvas).cssText : null,
            };
        });

        console.log('\n=== Canvas Info ===');
        console.log(JSON.stringify(sceneInfo, null, 2));

        // Take screenshot
        await page.screenshot({ path: 'screenshot-debug.png' });
        console.log('\nScreenshot saved to screenshot-debug.png');

        // Keep open for visual inspection
        console.log('\nKeeping browser open for 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));

    } finally {
        await browser.close();
    }
}

testLocalFile().catch(console.error);
