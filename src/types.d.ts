declare module 'markdown-it-footnote' {
  import type { MarkdownIt } from 'markdown-it';
  const plugin: (md: MarkdownIt) => void;
  export default plugin;
}

interface Navigator {
  userAgentData?: { platform: string; mobile: boolean; brands: { brand: string; version: string }[] };
}
