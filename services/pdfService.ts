import { PdfExtractResult } from '../types';

// We access the global pdfjsLib loaded via CDN in index.html
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export const extractTextFromPdf = async (file: File): Promise<PdfExtractResult> => {
  if (!window.pdfjsLib) {
    throw new Error("PDF Library not loaded");
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;

  let fullText = "";
  
  // Iterate through all pages
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n\n";
  }

  return {
    text: fullText,
    pageCount: pdfDocument.numPages
  };
};