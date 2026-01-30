import puppeteer from 'puppeteer';

async function visualTest(): Promise<void> {
    console.log('Loading https://niceplace.github.io in visible browser...\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Capture console
    page.on('console', (msg) => {
        const icon = {
            'error': '✗',
            'warning': '⚠',
            'log': '•',
        }[msg.type()] || '?';
        console.log(`${icon} [${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    try {
        await page.goto('https://niceplace.github.io', {
            waitUntil: 'networkidle0',
            timeout: 30000,
        });

        console.log('\nPage loaded. Taking screenshot in 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        await page.screenshot({
            path: 'screenshot.png',
            fullPage: false
        });
        console.log('Screenshot saved to screenshot.png');

        // Keep browser open for 5 seconds for visual inspection
        await new Promise(resolve => setTimeout(resolve, 5000));

    } finally {
        await browser.close();
    }
}

visualTest().catch(console.error);
