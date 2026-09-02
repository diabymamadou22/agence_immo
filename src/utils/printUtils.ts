/**
 * Ultra-robust printing utility that works in any browser, sandboxed iframe, or modal.
 */
export const printElement = (elementOrId: HTMLElement | string, documentTitle: string = 'Document Agence'): boolean => {
  let targetEl: HTMLElement | null = null;

  if (typeof elementOrId === 'string') {
    targetEl = document.getElementById(elementOrId);
  } else {
    targetEl = elementOrId;
  }

  if (!targetEl) {
    window.print();
    return false;
  }

  try {
    // Clone element and strip no-print items
    const clonedEl = targetEl.cloneNode(true) as HTMLElement;
    const noPrintItems = clonedEl.querySelectorAll('.print\\:hidden, .no-print, button, input:not([type="checkbox"]):not([type="radio"]), select');
    noPrintItems.forEach((el) => el.remove());

    // Gather CSS styles
    let stylesHtml = '';
    const styleElements = document.querySelectorAll('style, link[rel="stylesheet"]');
    styleElements.forEach((el) => {
      stylesHtml += el.outerHTML;
    });

    const fullHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${documentTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  ${stylesHtml}
  <style>
    @page { 
      size: A4 portrait; 
      margin: 6mm 8mm 6mm 8mm; 
    }
    *, *::before, *::after { 
      box-sizing: border-box !important; 
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html, body {
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: auto !important;
      font-size: 11px !important;
      line-height: 1.35 !important;
      overflow: visible !important;
    }
    .print\\:hidden, .no-print, button, nav, header, footer { display: none !important; }
    .page-break, .page-break-before { page-break-before: always !important; break-before: page !important; }
    .avoid-break { page-break-inside: avoid !important; break-inside: avoid !important; }
    table { width: 100% !important; border-collapse: collapse !important; }
    tr, td, th { page-break-inside: avoid !important; break-inside: avoid !important; }
    thead { display: table-header-group !important; }
    tfoot { display: table-footer-group !important; }
    img { max-width: 100% !important; height: auto !important; }
    
    /* Ensure printable document fits A4 width cleanly without horizontal overflow */
    .printable-document {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 0 !important;
      box-sizing: border-box !important;
    }

    /* Single page documents (Reçus de vente, Quittances, Reversements) must stay on 1 page */
    .single-page-a4 {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      max-height: 275mm !important;
    }
  </style>
</head>
<body class="bg-white text-slate-900 p-4">
  <div class="printable-document w-full bg-white">
    ${clonedEl.outerHTML}
  </div>
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.focus();
        window.print();
      }, 300);
    });
  </script>
</body>
</html>`;

    // Try Method 1: Popup Window (Best quality, no iframe clipping)
    let printWin: Window | null = null;
    try {
      printWin = window.open('', '_blank', 'width=900,height=800,menubar=no,toolbar=no,location=no,status=no');
    } catch {
      printWin = null;
    }

    if (printWin && !printWin.closed) {
      printWin.document.open();
      printWin.document.write(fullHtml);
      printWin.document.close();
      setTimeout(() => {
        try {
          printWin?.focus();
          printWin?.print();
        } catch {
          // fallback handled below
        }
      }, 500);
      return true;
    }

    // Method 2: Fallback to hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = '0';
    iframe.style.opacity = '0.01';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(fullHtml);
      iframeDoc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          window.print();
        }
        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 5000);
      }, 500);
      return true;
    }

    // Method 3: Direct window.print()
    window.print();
    return true;
  } catch (err) {
    console.error('[printUtils] Print fallback trigger:', err);
    window.print();
    return false;
  }
};


