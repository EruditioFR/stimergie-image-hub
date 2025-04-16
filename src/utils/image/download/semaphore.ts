
/**
 * Utility to limit concurrent operations
 */
export function createSemaphore(maxConcurrent: number) {
  let currentJobs = 0;
  const queue: (() => void)[] = [];
  
  return async function <T>(fn: () => Promise<T>): Promise<T> {
    if (currentJobs >= maxConcurrent) {
      await new Promise<void>(resolve => {
        queue.push(resolve);
      });
    }
    
    currentJobs++;
    
    try {
      return await fn();
    } finally {
      currentJobs--;
      
      if (queue.length > 0) {
        const next = queue.shift();
        if (next) next();
      }
    }
  };
}

