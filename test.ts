import puppeteer from 'puppeteer';

const url = 'https://niceplace.github.io';

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

    // Capture console messages
    const consoleMessages: ConsoleMessage[] = [];
    page.on('console', (msg) => {
        consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            location: msg.location(),
        });
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

    try {
        const response = await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000,
        });

        console.log(`Page loaded with status: ${response?.status()}\n`);

        // Wait a bit for any delayed errors
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check for canvas element
        const canvas = await page.$('#myCanvas');
        if (canvas) {
            console.log('✓ Canvas element found\n');
        } else {
            console.log('✗ Canvas element NOT found\n');
        }

        // Check console messages
        console.log('=== Console Messages ===');
        const errors = consoleMessages.filter(m => m.type === 'error');
        const warnings = consoleMessages.filter(m => m.type === 'warning');

        if (errors.length === 0 && warnings.length === 0) {
            console.log('✓ No errors or warnings in console\n');
        } else {
            console.log(`Found ${errors.length} error(s) and ${warnings.length} warning(s):\n`);
            errors.forEach(err => {
                console.log(`  [ERROR] ${err.text}`);
                if (err.location) {
                    console.log(`    at ${err.location.url}:${err.location.lineNumber}:${err.location.columnNumber}`);
                }
            });
            warnings.forEach(warn => {
                console.log(`  [WARN] ${warn.text}`);
            });
            console.log('');
        }

        // Check network requests
        console.log('=== Network Requests ===');
        const failedRequests = networkRequests.filter(r => r.status && r.status >= 400 && !r.url.includes('favicon.ico'));
        const successRequests = networkRequests.filter(r => r.status && r.status < 400);

        console.log(`Total requests: ${networkRequests.length}`);
        console.log(`Successful: ${successRequests.length}`);
        console.log(`Failed: ${failedRequests.length}\n`);

        if (failedRequests.length > 0) {
            console.log('Failed requests:');
            failedRequests.forEach(req => {
                console.log(`  [${req.status}] ${req.method} ${req.url}`);
            });
            console.log('');
        }

        // Final verdict
        if (errors.length === 0 && failedRequests.length === 0) {
            console.log('✓ ALL TESTS PASSED - Page is working correctly!\n');
            process.exit(0);
        } else {
            console.log('✗ TESTS FAILED - See errors above\n');
            process.exit(1);
        }

    } catch (error) {
        console.error('Error loading page:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runTests().catch(console.error);
