// ═══════════════════════════════════════════════════════════
// JourneyOS — Client-side PDF Text Extractor
// Uses pdfjs-dist worker from /public directory
// ═══════════════════════════════════════════════════════════

export interface PDFExtractionResult {
    success: boolean;
    text: string;
    pageCount: number;
    error?: string;
}

/**
 * Extract all text from a PDF file in the browser.
 * This function must only be called client-side.
 */
export async function extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
    try {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            return { success: false, text: '', pageCount: 0, error: 'Not a PDF file' };
        }

        // Dynamic import to avoid SSR - pointing specifically to legacy build
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

        // Set worker source to our locally hosted file
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            '/pdf.worker.min.mjs',
            window.location.origin
        ).toString();

        const arrayBuffer = await file.arrayBuffer();

        const pdf = await pdfjs.getDocument({
            data: new Uint8Array(arrayBuffer),
        }).promise;

        const pageCount = pdf.numPages;
        const textParts: string[] = [];

        for (let i = 1; i <= pageCount; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .filter((item: any) => 'str' in item)
                .map((item: any) => item.str)
                .join(' ');
            textParts.push(pageText);
        }

        const fullText = textParts.join('\n\n');

        if (fullText.trim().length < 50) {
            return {
                success: false, text: '', pageCount,
                error: 'PDF has too little extractable text — may be scanned/image-based',
            };
        }

        return { success: true, text: fullText, pageCount };
    } catch (err) {
        console.error('PDF extraction error:', err);
        const message = err instanceof Error ? err.message : 'Unknown error reading PDF';
        return { success: false, text: '', pageCount: 0, error: message };
    }
}
