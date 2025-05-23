declare module "html2pdf.js" {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: { scale?: number; scrollY?: number };
    jsPDF?: { unit?: string; format?: string | [number, number]; orientation?: "portrait" | "landscape" };
  }

  interface Html2Pdf {
    set: (options: Html2PdfOptions) => Html2Pdf;
    from: (element: HTMLElement) => Html2Pdf;
    save: () => void;
    outputPdf?: () => void | unknown;

  }

  const html2pdf: () => Html2Pdf;
  export default html2pdf;
}
