/**
 * PDF text extraction for pitch decks.
 *
 * Uses pdf-parse v2, which exposes a class-based API (`PDFParse`) instead of the
 * legacy v1 default-function call. Real text is read per-page from the TextResult
 * so the page-joiner markers (`-- N of M --`) are not stored or sent to Gemini.
 * A deck counts as "extractable" only when genuine text was produced, matching the
 * backend deck-evaluation gate (>= MIN_DECK_TEXT_CHARS characters). Image-only PDFs
 * and PPT/PPTX (which never reach this helper) are honestly reported as not
 * extractable — there is no faked extraction or evaluation.
 */
import { PDFParse } from 'pdf-parse';

export const MIN_DECK_TEXT_CHARS = 150;
export const MAX_DECK_TEXT_CHARS = 20000;

export const extractPdfText = async (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return { text: '', extractable: false };
  }

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const pages = Array.isArray(result?.pages) ? result.pages : [];
    const rawText = pages
      .map((page) => (typeof page?.text === 'string' ? page.text : ''))
      .join('\n')
      .trim();
    const text = rawText.slice(0, MAX_DECK_TEXT_CHARS);
    return { text, extractable: text.length >= MIN_DECK_TEXT_CHARS };
  } finally {
    try {
      await parser.destroy();
    } catch (err) {
      console.warn('PDF parser destroy warning:', err?.message);
    }
  }
};