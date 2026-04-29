/**
 * Captures a DOM element and downloads it as an A4 PDF.
 * Uses html2canvas (screenshot) + jsPDF (embed). Works reliably in Next.js
 * because it captures the actual rendered DOM — no CSS print tricks needed.
 */
export async function downloadInvoicePDF(element: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const canvas = await html2canvas(element, {
    scale: 2,                 // 2× for sharp text on retina
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    // Capture full height even if element is taller than viewport
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = pdf.internal.pageSize.getWidth();   // 210 mm
  const pageH = pdf.internal.pageSize.getHeight();  // 297 mm
  const imgH  = (canvas.height * pageW) / canvas.width;

  if (imgH <= pageH) {
    // Fits on one page
    pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgH);
  } else {
    // Multi-page: slice canvas into page-height chunks
    let yOffset = 0;
    while (yOffset < canvas.height) {
      const sliceH = Math.min(
        (pageH / pageW) * canvas.width,
        canvas.height - yOffset,
      );
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width  = canvas.width;
      sliceCanvas.height = sliceH;
      sliceCanvas.getContext('2d')!.drawImage(canvas, 0, -yOffset);
      pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 0, 0, pageW, (sliceH * pageW) / canvas.width);
      yOffset += sliceH;
      if (yOffset < canvas.height) pdf.addPage();
    }
  }

  pdf.save(filename);
}
