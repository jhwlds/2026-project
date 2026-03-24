import PDFParser from "pdf2json";

export async function extractPdfText(fileBuffer: Buffer): Promise<string> {
  const text = await new Promise<string>((resolve, reject) => {
    const parser = new PDFParser(undefined, true);

    parser.on("pdfParser_dataReady", () => {
      const raw = parser.getRawTextContent();
      resolve(raw ?? "");
    });
    parser.on("pdfParser_dataError", (error) => {
      if (error instanceof Error) {
        reject(error);
        return;
      }

      reject(error.parserError);
    });

    parser.parseBuffer(fileBuffer);
  });
  const normalizedText = text.trim();

  if (!normalizedText) {
    throw new Error("PDF has no extractable text. OCR is not supported in MVP.");
  }

  return normalizedText;
}
