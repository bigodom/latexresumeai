import { PdfExtractResult } from '../types';

export const MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_PDF_PAGES = 10;
export const MAX_EXTRACTED_TEXT_LENGTH = 50_000;

// We access the global pdfjsLib loaded via CDN in index.html
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export const extractTextFromPdf = async (file: File): Promise<PdfExtractResult> => {
  if (!window.pdfjsLib) {
    throw new Error('O leitor de PDF não foi carregado. Recarregue a página.');
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    throw new Error('O PDF deve ter no máximo 5 MB.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const signature = new TextDecoder().decode(arrayBuffer.slice(0, 5));
  if (signature !== '%PDF-') {
    throw new Error('O arquivo selecionado não possui uma assinatura PDF válida.');
  }

  const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;
  const pageCount = pdfDocument.numPages;

  if (pageCount > MAX_PDF_PAGES) {
    await pdfDocument.destroy();
    throw new Error(`O currículo deve ter no máximo ${MAX_PDF_PAGES} páginas.`);
  }

  let fullText = "";

  try {
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += `${pageText}\n\n`;
    }
  } finally {
    await pdfDocument.destroy();
  }

  fullText = fullText.trim();
  if (!fullText) {
    throw new Error('Não foi encontrado texto no PDF. Ele pode ser uma imagem; cole o conteúdo manualmente.');
  }
  if (fullText.length > MAX_EXTRACTED_TEXT_LENGTH) {
    throw new Error('O texto extraído é grande demais. Reduza o currículo antes de continuar.');
  }

  return {
    text: fullText,
    pageCount
  };
};
