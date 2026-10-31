export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export function delay(ms: number): Promise<void>
{
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function fetchUserProfiles(
  userIds: string[]
): Promise<UserProfile[]> {
  if (userIds.length === 0)
  {
    return [];
  }
  try {
    const requests: Promise<UserProfile>[] = userIds.map(
      async (id: string): Promise<UserProfile> => {
        const ms: number = 50 + Math.floor(Math.random() * 101);
        await delay(ms);
        return { id, name: `User ${id}`, email: `user${id}@example.com` };
      }
    );
    return await Promise.all(requests);
  } catch (error) {
    console.error('Помилка завантаження профілів:', error);
    throw error;
  }
}

export async function retryOperation(
  operation: () => Promise<unknown>,
  maxRetries: number = 3
): Promise<unknown> {
  let lastError: unknown;
  for (let n: number = 1; n <= maxRetries; n++)
  {
    console.log(`Спроба ${n}...`);
    try
    {
      return await operation();
    } catch (error) {
      lastError = error;
      if (n < maxRetries)
      {
        await delay(100);
      }
    }
  }
  throw lastError;
}

export async function processInBatches(
  items: number[],
  batchSize: number,
  processor: (batch: number[]) => Promise<number[]>
): Promise<number[]> {
  const results: number[] = [];
  const total: number = Math.ceil(items.length / batchSize);
  for (let i: number = 0; i < items.length; i += batchSize)
  {
    const n: number = i / batchSize + 1;
    console.log(`Обробка партії ${n}/${total}...`);
    const batch: number[] = items.slice(i, i + batchSize);
    try
    {
      const batchResult: number[] = await processor(batch);
      results.push(...batchResult);
    } catch (error) {
      console.error(`Помилка в партії ${n}:`, error);
      throw error;
    }
  }
  return results;
}

export async function raceWithTimeout(
  promise: Promise<unknown>,
  timeoutMs: number
): Promise<unknown> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout: Promise<never> = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  try
  {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
