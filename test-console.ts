import puppeteer from 'puppeteer';

async function testWithConsole(): Promise<void> {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Capture ALL console messages
    page.on('console', (msg) => {
        console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    page.on('pageerror', (err) => {
        console.log(`[PAGE ERROR] ${err.toString()}`);
    });

    try {
        await page.goto('file:///Users/simonbeaulieu/workspace/personal/niceplace.github.io/index.html');
        console.log('\nPage loaded. Waiting 5 seconds...\n');

        await new Promise(resolve => setTimeout(resolve, 5000));

        // Check what's in the scene
        const sceneInfo = await page.evaluate(() => {
            const canvas = document.getElementById('myCanvas');
            const gl = canvas?.getContext('webgl') || canvas?.getContext('webgl2');

            return {
                canvas: !!canvas,
                webgl: !!gl,
                webglVersion: gl ? (gl instanceof WebGL2RenderingContext ? '2' : '1') : null,
                viewport: gl ? { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight } : null,
            };
        });

        console.log('Scene Info:', JSON.stringify(sceneInfo, null, 2));

    } finally {
        await browser.close();
    }
}

testWithConsole().catch(console.error);
