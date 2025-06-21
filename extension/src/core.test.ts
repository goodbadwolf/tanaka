import { describe, it, expect } from '@jest/globals';

describe('Core functionality', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  it('should handle objects', () => {
    const obj = { name: 'Tanaka', type: 'extension' };
    expect(obj).toHaveProperty('name', 'Tanaka');
    expect(obj).toMatchObject({ type: 'extension' });
  });
});