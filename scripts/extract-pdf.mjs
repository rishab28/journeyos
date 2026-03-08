#!/usr/bin/env node
/**
 * Standalone PDF text extraction script.
 * Called via child_process to bypass Next.js Webpack bundling issues.
 * Usage: node extract-pdf.mjs <path-to-pdf>
 * Outputs: extracted text to stdout
 */
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync } from 'fs';

const filePath = process.argv[2];
if (!filePath) {
    console.error('Usage: node extract-pdf.mjs <path-to-pdf>');
    process.exit(1);
}

try {
    const data = new Uint8Array(readFileSync(filePath));
    const doc = await getDocument({ data }).promise;
    let fullText = '';

    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
    }

    process.stdout.write(fullText.trim());
} catch (err) {
    console.error(`PDF extraction failed: ${err.message}`);
    process.exit(1);
}
