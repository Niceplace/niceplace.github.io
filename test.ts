import puppeteer from 'puppeteer';

const url = process.argv[2] || 'https://niceplace.github.io';

interface ConsoleMessage {
    type: string;
    text: string;
    location?: { url: string; lineNumber: number; columnNumber: number };
}

interface NetworkRequest {
    url: string;
    method: string;
    status: number | null;
    success: boolean;
    type?: string;
}

async function runTests(): Promise<void> {
    console.log(`Testing ${url}...\n`);

    const browser = await puppeteer.launch({
        headless: true,
    });

    const page = await browser.newPage();

    // Capture ALL console messages
    const consoleMessages: ConsoleMessage[] = [];
    page.on('console', (msg) => {
        consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            location: msg.location(),
        });
        // Also log to terminal immediately for debugging
        const icon = {
            'error': '✗',
            'warning': '⚠',
            'log': '•',
            'info': 'ℹ',
            'debug': '◦'
        }[msg.type()] || '?';
        console.log(`${icon} [${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    // Capture network requests
    const networkRequests: NetworkRequest[] = [];
    page.on('request', (request) => {
        networkRequests.push({
            url: request.url(),
            method: request.method(),
            status: null,
            success: false,
            type: request.resourceType(),
        });
    });

    page.on('response', (response) => {
        const request = networkRequests.find(r => r.url === response.url());
        if (request) {
            request.status = response.status();
            request.success = response.ok();
        }
    });

    page.on('requestfailed', (request) => {
        const req = networkRequests.find(r => r.url === request.url());
        if (req) {
            req.success = false;
            req.status = 0;
        }
        console.log(`✗ [NETWORK FAILED] ${request.failure()?.errorText} - ${request.url()}`);
    });

    try {
        const response = await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 30000,
        });

        console.log(`\nPage loaded with status: ${response?.status()}`);

        // Wait for animations to start
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check for canvas element
        const canvasInfo = await page.evaluate(() => {
            const canvas = document.getElementById('myCanvas');
            if (!canvas) return { exists: false, webgl: false };

            const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
            return {
                exists: true,
                webgl: !!gl,
                width: canvas.width,
                height: canvas.height
            };
        });

        console.log(`\n=== Canvas Info ===`);
        console.log(`Exists: ${canvasInfo.exists}`);
        console.log(`WebGL context: ${canvasInfo.webgl}`);
        console.log(`Size: ${canvasInfo.width}x${canvasInfo.height}`);

        // Summary
        const errors = consoleMessages.filter(m => m.type === 'error');
        const warnings = consoleMessages.filter(m => m.type === 'warning');
        const failedRequests = networkRequests.filter(r => !r.success && !r.url.includes('favicon'));

        console.log(`\n=== Summary ===`);
        console.log(`Console errors: ${errors.length}`);
        console.log(`Console warnings: ${warnings.length}`);
        console.log(`Failed network requests: ${failedRequests.length}`);

        if (errors.length > 0) {
            console.log(`\n✗ TESTS FAILED - ${errors.length} error(s) found\n`);
            process.exit(1);
        } else if (failedRequests.length > 0) {
            console.log(`\n✗ TESTS FAILED - ${failedRequests.length} network request(s) failed\n`);
            process.exit(1);
        } else {
            console.log(`\n✓ ALL TESTS PASSED\n`);
            process.exit(0);
        }

    } catch (error) {
        console.error('\n✗ Error loading page:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runTests().catch(console.error);
