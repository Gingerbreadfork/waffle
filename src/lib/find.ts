// Find in the reading room. Matches are DOM ranges over the rendered page,
// painted with the CSS highlight API so the page itself is never changed.

const BLOCKS = new Set([
  'ARTICLE', 'BLOCKQUOTE', 'DD', 'DETAILS', 'DIV', 'DL', 'DT', 'FIGCAPTION', 'FIGURE', 'H1', 'H2', 'H3', 'H4', 'H5',
  'H6', 'LI', 'OL', 'P', 'PRE', 'SECTION', 'SUMMARY', 'TABLE', 'TD', 'TH', 'TR', 'UL',
]);

const SKIP = '.code-copy, .code-lang';

// Quotes and dashes are typographic only on the page, so plain ones typed in the box still match.
function fold(text: string): string {
  return text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-');
}

function blockOf(el: Element, root: Element): Element {
  let node = el;
  while (node !== root && !BLOCKS.has(node.tagName) && node.parentElement) node = node.parentElement;
  return node;
}

// The index of the last start at or before `pos`.
function locate(starts: number[], pos: number): number {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= pos) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export function findRanges(root: Element, query: string): Range[] {
  const words = fold(query).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  // Any run of spaces in the query matches any whitespace, so a phrase broken across source lines is found.
  const pattern = new RegExp(words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+'), 'giu');

  const nodes: Text[] = [];
  const starts: number[] = [];
  let text = '';
  let block: Element | null = null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || parent.closest(SKIP)) continue;
    const owner = blockOf(parent, root);
    // A character no query can match keeps matches inside one block.
    if (owner !== block) {
      text += '\0';
      block = owner;
    }
    nodes.push(node as Text);
    starts.push(text.length);
    text += (node as Text).data;
  }

  const ranges: Range[] = [];
  for (const match of fold(text).matchAll(pattern)) {
    const start = match.index;
    const end = start + match[0].length;
    const first = locate(starts, start);
    const last = locate(starts, end - 1);
    const range = document.createRange();
    range.setStart(nodes[first], start - starts[first]);
    range.setEnd(nodes[last], end - starts[last]);
    ranges.push(range);
  }
  return ranges;
}

// The first range that ends below `y`, or the first range if none does.
export function firstBelow(ranges: Range[], y: number): number {
  let lo = 0;
  let hi = ranges.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (ranges[mid].getBoundingClientRect().bottom > y) hi = mid;
    else lo = mid + 1;
  }
  return lo < ranges.length ? lo : 0;
}
