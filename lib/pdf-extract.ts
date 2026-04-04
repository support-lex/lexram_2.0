export async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  // Basic text extraction — returns raw text content from PDF
  const extracted = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s{2,}/g, ' ').trim();
  return extracted || 'Unable to extract text from this PDF.';
}
