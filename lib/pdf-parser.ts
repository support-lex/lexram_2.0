export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    return file.text();
  }
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    const { extractPdfText } = await import('./pdf-extract');
    return extractPdfText(file);
  }
  return file.text();
}
