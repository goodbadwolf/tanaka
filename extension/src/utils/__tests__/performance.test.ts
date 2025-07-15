/*
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { measurePerformance, performanceMonitor } from '../performance';

describe('performanceMonitor', () => {
  beforeEach(() => {
    performanceMonitor.clear();
    performanceMonitor.setEnabled(true);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'group').mockImplementation(() => undefined);
    jest.spyOn(console, 'groupEnd').mockImplementation(() => undefined);
    jest.spyOn(console, 'table').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('start and end', () => {
    it('should measure duration between start and end', () => {
      performanceMonitor.start('test-operation');

      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // busy wait
      }

      const duration = performanceMonitor.end('test-operation');

      expect(duration).toBeDefined();
      expect(duration).toBeGreaterThan(0);
    });

    it('should warn when ending a non-existent mark', () => {
      const duration = performanceMonitor.end('non-existent');

      expect(duration).toBeUndefined();
      expect(console.warn).toHaveBeenCalledWith("Performance mark 'non-existent' not found");
    });

    it('should warn for slow operations', () => {
      jest.clearAllMocks();

      // Mock performance.now to simulate slow operation
      let callCount = 0;
      jest.spyOn(performance, 'now').mockImplementation(() => {
        return callCount++ === 0 ? 0 : 150;
      });

      performanceMonitor.start('slow-operation');
      performanceMonitor.end('slow-operation');

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow operation detected: slow-operation took 150.00ms'),
      );

      jest.spyOn(performance, 'now').mockRestore();
    });
  });

  describe('measure', () => {
    it('should measure synchronous function execution', async () => {
      const result = await performanceMonitor.measure('sync-fn', () => {
        return 'test-result';
      });

      expect(result).toBe('test-result');

      const marks = performanceMonitor.getMarks();
      expect(marks).toHaveLength(1);
      expect(marks[0].name).toBe('sync-fn');
      expect(marks[0].duration).toBeDefined();
    });

    it('should measure asynchronous function execution', async () => {
      const result = await performanceMonitor.measure('async-fn', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'async-result';
      });

      expect(result).toBe('async-result');

      const marks = performanceMonitor.getMarks();
      expect(marks).toHaveLength(1);
      expect(marks[0].name).toBe('async-fn');
      expect(marks[0].duration).toBeDefined();
      expect(marks[0].duration).toBeGreaterThan(0);
    });

    it('should handle errors in measured functions', async () => {
      await expect(
        performanceMonitor.measure('error-fn', () => {
          throw new Error('Test error');
        }),
      ).rejects.toThrow('Test error');

      const marks = performanceMonitor.getMarks();
      expect(marks).toHaveLength(1);
      expect(marks[0].name).toBe('error-fn');
      expect(marks[0].duration).toBeDefined();
    });
  });

  describe('generateReport', () => {
    it('should generate a performance report', () => {
      let time = 0;
      jest.spyOn(performance, 'now').mockImplementation(() => (time += 10));

      performanceMonitor.start('op1');
      performanceMonitor.end('op1');

      performanceMonitor.start('op2');
      performanceMonitor.end('op2');

      const report = performanceMonitor.generateReport();

      expect(report.marks).toHaveLength(2);
      expect(report.totalDuration).toBe(20); // 10ms each
      expect(report.timestamp).toBeLessThanOrEqual(Date.now());

      jest.spyOn(performance, 'now').mockRestore();
    });
  });

  describe('enabled state', () => {
    it('should not track when disabled', () => {
      performanceMonitor.setEnabled(false);

      performanceMonitor.start('disabled-op');
      const duration = performanceMonitor.end('disabled-op');

      expect(duration).toBeUndefined();
      expect(performanceMonitor.getMarks()).toHaveLength(0);
    });
  });

  describe('logReport', () => {
    it('should log performance report to console', () => {
      performanceMonitor.start('test-op');
      performanceMonitor.end('test-op');

      performanceMonitor.logReport();

      expect(console.info).toHaveBeenCalledWith('Performance Report');
      expect(console.info).toHaveBeenCalled();
      expect(console.info).toHaveBeenCalledWith(expect.stringContaining('Total duration:'));
      expect(console.info).toHaveBeenCalled();
    });
  });
});

describe('measurePerformance decorator', () => {
  beforeEach(() => {
    performanceMonitor.clear();
    performanceMonitor.setEnabled(true);
  });

  it('should measure method execution time', async () => {
    class TestClass {
      @measurePerformance
      async testMethod(value: string): Promise<string> {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return `processed: ${value}`;
      }
    }

    const instance = new TestClass();
    const result = await instance.testMethod('input');

    expect(result).toBe('processed: input');

    const marks = performanceMonitor.getMarks();
    const mark = marks.find((m) => m.name === 'TestClass.testMethod');
    expect(mark).toBeDefined();
    if (mark) {
      expect(mark.duration).toBeDefined();
      expect(mark.duration).toBeGreaterThan(0);
    }
  });
});
*/
