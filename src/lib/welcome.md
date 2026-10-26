# Welcome to Waffle

Waffle is a place to read and write Markdown. It has two rooms: one for reading, one for writing. Each is built for its own job, and you move between them with a single key.

You're in the reading room now. Press **Ctrl+E** (⌘E on a Mac) to step into the writing room, and press it again to come back. Or double-click any paragraph to start editing right there.

## Reading

The reading room is set in Fraunces, a warm serif that holds up at every size. The column is a comfortable width, the line height is generous, and nothing competes with the words. On a wide screen a table of contents sits to the left and follows you as you scroll.

> A good reading view has one job: get out of the way.

Headings, lists, quotes, tables, footnotes[^1], task lists and code all render the way you'd expect.

- Lists get golden markers
- Nested items work too
  - Like this one
- Links look like [blueberries on a waffle](https://commonmark.org/help/)

1. Numbered lists keep their numbers
2. Even when an item runs long enough to wrap onto a second line, the hanging indent keeps the text aligned

### A task list you can actually use

Tick a box here and Waffle updates the Markdown behind it.

- [x] Open Waffle
- [ ] Switch to the writing room
- [ ] Save this document to a file

### Code

```ts
export function toast(message: string, ms = 1800) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.append(el);
  setTimeout(() => el.remove(), ms);
}
```

Inline code like `Ctrl+S` gets a quiet pill. Hover a code block for a copy button.

### Shortcuts

| Keys | What happens |
| --- | --- |
| Ctrl+E | Switch between reading and writing |
| Esc | Back to reading |
| Ctrl+S | Save to a file |
| Ctrl+O | Open a Markdown file |
| Ctrl+\ | Show your documents |
| Ctrl+B, Ctrl+I, Ctrl+K | Bold, italic, link while writing |
| Ctrl+F | Find on the page, or find and replace while writing |

---

## Writing

The writing room is plain text with just enough styling to keep you oriented. Headings grow, emphasis shows, and the Markdown punctuation turns golden so it stays legible without shouting.

When you switch rooms, Waffle keeps your place. Whatever was at the top of your screen stays at the top, and when you come back to reading, the paragraph you were working on glows for a moment so you can find it.

Turn on **Focus** from the bottom bar to dim everything except the paragraph you're in.

## Your documents

Everything you write is saved in this browser as you type. Open the list with the button in the top left, or press Ctrl+\\.

To keep a document outside the browser, save it to a file with Ctrl+S. Waffle remembers the file, so later saves go straight back to it. You can also drop a Markdown file anywhere on this window to open it.

[^1]: Footnotes gather at the end of the document, like this one.
