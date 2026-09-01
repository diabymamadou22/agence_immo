/**
 * Robust printing utility designed to work seamlessly in both standard browsers and sandboxed iframe environments.
 */

export const printElement = (elementOrId: HTMLElement | string, documentTitle: string = 'Document Agence'): boolean => {
  let targetEl: HTMLElement | null = null;

  if (typeof elementOrId === 'string') {
    targetEl = document.getElementById(elementOrId);
  } else {
    targetEl = elementOrId;
  }

  if (!targetEl) {
    console.warn(`[printUtils] Element not found for printing:`, elementOrId);
    window.print();
    return false;
  }

  try {
    // 1. Collect all styles & stylesheets from the main document
    let stylesHtml = '';
    const styleTags = document.querySelectorAll('style, link[rel="stylesheet"]');
    styleTags.forEach((tag) => {
      stylesHtml += tag.outerHTML;
    });

    // 2. Create an invisible print iframe to isolate the printable document
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    iframe.title = 'Print Frame';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      window.print();
      return false;
    }

    // 3. Write isolated HTML to the iframe
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${documentTitle}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          ${stylesHtml}
          <style>
            @page {
              size: A4;
              margin: 12mm 10mm 12mm 10mm;
            }
            body {
              background: white !important;
              color: #0f172a !important;
              font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print\\:hidden, .no-print {
              display: none !important;
            }
            .page-break {
              page-break-before: always;
            }
          </style>
        </head>
        <body>
          <div class="p-4 sm:p-6 bg-white">
            ${targetEl.innerHTML}
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();

    // 4. Wait for resources/fonts to load inside the iframe, then trigger print
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('[printUtils] iframe print failed, falling back to window.print', err);
        window.print();
      }

      // Cleanup iframe after printing dialog closes
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }, 400);

    return true;
  } catch (error) {
    console.error('[printUtils] Error setting up print iframe:', error);
    window.print();
    return false;
  }
};
