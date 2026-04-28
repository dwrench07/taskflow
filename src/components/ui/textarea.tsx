import * as React from 'react';

import {cn} from '@/lib/utils';

const BULLET_RE = /^(\s*)([-*])\s(.*)$/;
const ORDERED_RE = /^(\s*)(\d+)\.\s(.*)$/;

function handleAutoBullet(
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>
) {
  if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.defaultPrevented) return;

  const ta = e.currentTarget;
  const { selectionStart, selectionEnd, value } = ta;
  if (selectionStart !== selectionEnd) return;

  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  const lineEnd = value.indexOf('\n', selectionStart);
  const currentLine = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);

  const bulletMatch = currentLine.match(BULLET_RE);
  const orderedMatch = currentLine.match(ORDERED_RE);
  if (!bulletMatch && !orderedMatch) return;

  const content = bulletMatch ? bulletMatch[3] : orderedMatch![3];

  e.preventDefault();

  let insert: string;
  let newValue: string;
  let newCursor: number;

  if (content.trim() === '') {
    // Empty list item — exit the list by removing the marker on this line
    const before = value.slice(0, lineStart);
    const after = value.slice(selectionStart);
    newValue = before + after;
    newCursor = lineStart;
  } else {
    if (bulletMatch) {
      insert = `\n${bulletMatch[1]}${bulletMatch[2]} `;
    } else {
      const indent = orderedMatch![1];
      const next = parseInt(orderedMatch![2], 10) + 1;
      insert = `\n${indent}${next}. `;
    }
    newValue = value.slice(0, selectionStart) + insert + value.slice(selectionEnd);
    newCursor = selectionStart + insert.length;
  }

  // Use the native input value setter so React picks up the change
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    'value'
  )?.set;
  setter?.call(ta, newValue);
  ta.setSelectionRange(newCursor, newCursor);
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, onKeyDown, onChange, ...props}, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          handleAutoBullet(e, onChange);
        }}
        onChange={onChange}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
