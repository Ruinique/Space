import { marked } from 'marked';
import katex from 'katex';

/**
 * Renders short Markdown with inline ($...$) and block ($$...$$) LaTeX math
 * into HTML for Lab Notes (/moments) and /admin live preview.
 */
export function renderAcademicMarkdown(source: string): string {
  const mathBlocks: string[] = [];
  const codeSpans: string[] = [];

  // 1. Preserve escaped \$
  let processed = source.replace(/\\\$/g, '@@ESCAPED_DOLLAR@@');

  // 2. Protect fenced code blocks and inline code spans so $ inside code is never parsed as math
  processed = processed.replace(/```[\s\S]*?```|`[^`\n]+`/g, (match) => {
    const idx = codeSpans.length;
    codeSpans.push(match);
    return `@@CODE_SPAN_${idx}@@`;
  });

  // 3. Extract display math $$...$$
  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
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

  // 4. Extract inline math $...$ (skip currency amounts and CJK prose)
  processed = processed.replace(/(?<![\\0-9])\$(?!\s)([^\n$]+?)(?<!\s)\$/g, (full, expr) => {
    const trimmed = expr.trim();
    if (/^\d[\d.,]*(\s|\/|$)/.test(trimmed) || /[\u4e00-\u9fff]/.test(trimmed)) {
      return full;
    }
    const idx = mathBlocks.length;
    try {
      mathBlocks.push(
        katex.renderToString(trimmed, { displayMode: false, throwOnError: false })
      );
    } catch {
      mathBlocks.push(`<code>${expr}</code>`);
    }
    return `@@MATH_BLOCK_${idx}@@`;
  });

  // 5. Restore protected code blocks/spans so marked parses them normally
  codeSpans.forEach((code, idx) => {
    processed = processed.replace(`@@CODE_SPAN_${idx}@@`, code);
  });

  // 6. Parse Markdown (GFM tables, lists, code)
  let html = marked.parse(processed, { async: false, breaks: true, gfm: true }) as string;

  // 7. Restore rendered KaTeX math blocks
  mathBlocks.forEach((rendered, idx) => {
    html = html.replace(`@@MATH_BLOCK_${idx}@@`, rendered);
  });

  return html.replace(/@@ESCAPED_DOLLAR@@/g, '$');
}
