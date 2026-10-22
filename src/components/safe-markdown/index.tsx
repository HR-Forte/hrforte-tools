import Markdown, { MarkdownToJSX } from 'markdown-to-jsx';
import { ComponentProps } from 'react';

// Markdown content can come from other users (shared notes) or external APIs (changelogs).
// Keep harmless inline HTML, but never render active or embedding elements.
const Blocked = () => null;
const BLOCKED_TAGS = [
  'script',
  'style',
  'iframe',
  'frame',
  'frameset',
  'object',
  'embed',
  'applet',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'option',
  'link',
  'meta',
  'base',
  'svg',
  'math',
];
const overrides: MarkdownToJSX.Overrides = Object.fromEntries(BLOCKED_TAGS.map(tag => [tag, Blocked]));

type SafeMarkdownProps = Omit<ComponentProps<typeof Markdown>, 'options'> & { options?: MarkdownToJSX.Options };

export default function SafeMarkdown({ options, ...props }: SafeMarkdownProps) {
  return <Markdown {...props} options={{ ...options, overrides: { ...options?.overrides, ...overrides } }} />;
}
