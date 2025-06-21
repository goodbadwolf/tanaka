import { describe, it, expect } from 'vitest';
import { asMessage, isMessage, Message } from '../core';

describe('core message parsing', () => {
  it('parses TRACK_WINDOW messages', () => {
    const input: Message = { type: 'TRACK_WINDOW', windowId: 42 };
    expect(asMessage(input)).toEqual(input);
    expect(isMessage(input)).toBe(true);
  });

  it('parses UNTRACK_WINDOW messages', () => {
    const input: Message = { type: 'UNTRACK_WINDOW', windowId: 7 };
    expect(asMessage(input)).toEqual(input);
    expect(isMessage(input)).toBe(true);
  });

  it('parses GET_TRACKED_WINDOWS message', () => {
    const input: Message = { type: 'GET_TRACKED_WINDOWS' };
    expect(asMessage(input)).toEqual(input);
    expect(isMessage(input)).toBe(true);
  });

  it('rejects messages missing type', () => {
    const bad1 = { windowId: 1 };
    expect(asMessage(bad1)).toBeNull();
    expect(isMessage(bad1)).toBe(false);
  });

  it('rejects TRACK_WINDOW without windowId', () => {
    const bad = { type: 'TRACK_WINDOW' };
    expect(asMessage(bad)).toBeNull();
    expect(isMessage(bad)).toBe(false);
  });

  it('rejects TRACK_WINDOW with non-number windowId', () => {
    const bad: unknown = { type: 'TRACK_WINDOW', windowId: 'foo' };
    expect(asMessage(bad)).toBeNull();
    expect(isMessage(bad)).toBe(false);
  });

  it('rejects unknown message types', () => {
    const bad: unknown = { type: 'FOO', windowId: 1 };
    expect(asMessage(bad)).toBeNull();
    expect(isMessage(bad)).toBe(false);
  });

  it('rejects non-object inputs', () => {
    expect(asMessage(null)).toBeNull();
    expect(asMessage(123)).toBeNull();
    expect(asMessage('foo')).toBeNull();
    expect(isMessage(null)).toBe(false);
  });
});
