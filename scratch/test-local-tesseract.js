const { createWorker } = require('tesseract.js');
const path = require('path');
const fs = require('fs');

async function testLocalTesseract() {
    try {
        console.log('Verifying eng.traineddata path...');
        const trainedDataPath = path.join(process.cwd(), 'eng.traineddata');
        if (fs.existsSync(trainedDataPath)) {
            console.log(`Found eng.traineddata at ${trainedDataPath} (${fs.statSync(trainedDataPath).size} bytes)`);
        } else {
            console.error('eng.traineddata not found in current directory!');
            return;
        }

        console.log('Initializing Tesseract worker...');
        const startTime = Date.now();

        // Configure Tesseract.js to run completely offline using local cachePath
        const worker = await createWorker('eng', 1, {
            cachePath: process.cwd(),
            gzip: false
        });

        console.log(`Worker initialized in ${Date.now() - startTime}ms`);

        // Test with a sample image if one exists
        const testImage = path.join(process.cwd(), 'captcha-test.png');
        if (fs.existsSync(testImage)) {
            console.log('Parsing captcha-test.png...');
            const ocrStart = Date.now();
            const { data: { text } } = await worker.recognize(testImage);
            console.log(`OCR parsing took ${Date.now() - ocrStart}ms`);
            console.log('OCR Output Text:', text);
        } else {
            console.log('No test image found at:', testImage);
        }

        await worker.terminate();
    } catch (e) {
        console.error('Tesseract offline test failed:', e);
    }
}

testLocalTesseract();
