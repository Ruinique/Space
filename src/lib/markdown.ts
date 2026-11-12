import { marked } from 'marked';
import katex from 'katex';

/**
 * Renders short Markdown with inline ($...$) and block ($$...$$) LaTeX math
 * into HTML for Lab Notes (/moments) and /admin live preview.
 */
export function renderAcademicMarkdown(source: string): string {
  const mathBlocks: string[] = [];

  // Extract display math $$...$$ first
  let processed = source.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
    const idx = mathBlocks.length;
    try {
      mathBlocks.push(
        katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false })
      );
    } catch {
      mathBlocks.push(`<pre>${expr}</pre>`);
    }
    return `@@MATH_BLOCK_${idx}@@`;
  });

  // Extract inline math $...$
  processed = processed.replace(/\$([^\n$]+?)\$/g, (_, expr) => {
    const idx = mathBlocks.length;
    try {
      mathBlocks.push(
        katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false })
      );
    } catch {
      mathBlocks.push(`<code>${expr}</code>`);
    }
    return `@@MATH_BLOCK_${idx}@@`;
  });

  let html = marked.parse(processed, { async: false, breaks: true }) as string;

  mathBlocks.forEach((rendered, idx) => {
    html = html.replace(`@@MATH_BLOCK_${idx}@@`, rendered);
  });

  return html;
}
