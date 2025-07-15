export interface PerformanceMark {
  name: string
  startTime: number
  endTime?: number
  duration?: number
}

export interface PerformanceReport {
  marks: PerformanceMark[]
  totalDuration: number
  timestamp: number
}

class PerformanceMonitor {
  private marks = new Map<string, PerformanceMark>()
  private enabled: boolean = process.env.NODE_ENV === "development"

  /**
   * Start a performance measurement
   */
  start(name: string): void {
    if (!this.enabled) return

    const mark: PerformanceMark = {
      name,
      startTime: performance.now(),
    }

    this.marks.set(name, mark)

    if ("performance" in globalThis && "mark" in performance) {
      performance.mark(`${name}-start`)
    }
  }

  /**
   * End a performance measurement
   */
  end(name: string): number | undefined {
    if (!this.enabled) return

    const mark = this.marks.get(name)
    if (!mark) {
      console.warn(`Performance mark '${name}' not found`)
      return
    }

    mark.endTime = performance.now()
    mark.duration = mark.endTime - mark.startTime

    if ("performance" in globalThis && "mark" in performance) {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
    }

    if (mark.duration > 100) {
      console.warn(
        `Slow operation detected: ${name} took ${mark.duration.toFixed(2)}ms`,
      )
    }

    return mark.duration
  }

  /**
   * Measure a function's execution time
   */
  async measure<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
    this.start(name)
    try {
      const result = await fn()
      this.end(name)
      return result
    } catch (error) {
      this.end(name)
      throw error
    }
  }

  /**
   * Get all performance marks
   */
  getMarks(): PerformanceMark[] {
    return Array.from(this.marks.values()).filter(
      (mark) => mark.duration !== undefined,
    )
  }

  /**
   * Generate a performance report
   */
  generateReport(): PerformanceReport {
    const marks = this.getMarks()
    const totalDuration = marks.reduce(
      (sum, mark) => sum + (mark.duration ?? 0),
      0,
    )

    return {
      marks,
      totalDuration,
      timestamp: Date.now(),
    }
  }

  /**
   * Clear all marks
   */
  clear(): void {
    this.marks.clear()

    if ("performance" in globalThis && "clearMarks" in performance) {
      performance.clearMarks()
      performance.clearMeasures()
    }
  }

  /**
   * Log performance report to console
   */
  logReport(): void {
    if (!this.enabled) return

    const report = this.generateReport()

    console.info("Performance Report")
    console.info(
      report.marks.map((mark) => ({
        name: mark.name,
        duration: `${mark.duration?.toFixed(2)}ms`,
      })),
    )
    console.info(`Total duration: ${report.totalDuration.toFixed(2)}ms`)
  }

  /**
   * Enable/disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Decorator for measuring method execution time
export function measurePerformance(
  target: Record<string, unknown>,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value

  descriptor.value = async function (this: unknown, ...args: unknown[]) {
    const className = target.constructor.name
    const fullName = `${className}.${propertyKey}`

    return performanceMonitor.measure(fullName, () =>
      originalMethod.apply(this, args),
    )
  }

  return descriptor
}

// React/Preact hook for measuring component render time
export function useRenderTime(componentName: string): void {
  if (process.env.NODE_ENV !== "development") return

  const startTime = performance.now()

  // This will run after render
  queueMicrotask(() => {
    const renderTime = performance.now() - startTime
    if (renderTime > 16.67) {
      // More than one frame (60fps)
      console.warn(
        `Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`,
      )
    }
  })
}

// Track component render counts in development
const componentRenderCounts = new Map<string, number>()

export function trackComponentRender(componentName: string): void {
  if (process.env.NODE_ENV !== "development") return

  const count = (componentRenderCounts.get(componentName) ?? 0) + 1
  componentRenderCounts.set(componentName, count)
}

export function logRenderStats(): void {
  if (process.env.NODE_ENV !== "development") return

  const stats = Array.from(componentRenderCounts.entries())
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])

  if (stats.length > 0) {
    console.info("🚀 Component Render Stats")
    stats.forEach(([name, count]) => {
      console.info(`${name}: ${count} renders`)
    })
  }
}

// Auto-log stats every 10 seconds in development
if (process.env.NODE_ENV === "development") {
  setInterval(logRenderStats, 10000)
}
