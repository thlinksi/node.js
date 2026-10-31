import {
  UserProfile,
  delay,
  fetchUserProfiles,
  retryOperation,
  processInBatches,
  raceWithTimeout,
} from './lab1';

let logSpy: jest.SpyInstance;

beforeEach(() => {
  jest.useFakeTimers();
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('fetchUserProfiles', () => {
  it('should return empty array for empty userIds', async () => {
    const profiles: UserProfile[] = await fetchUserProfiles([]);
    expect(profiles).toEqual([]);
    expect(profiles).toHaveLength(0);
  });

  it('should load profiles in parallel', async () => {
    const promise: Promise<UserProfile[]> = fetchUserProfiles(['1', '2', '3']);
    await jest.advanceTimersByTimeAsync(150);
    const profiles: UserProfile[] = await promise;
    expect(profiles).toHaveLength(3);
    expect(profiles[0]).toEqual({
      id: '1',
      name: 'User 1',
      email: 'user1@example.com',
    });
    expect(profiles[2]).toHaveProperty('email', 'user3@example.com');
  });

  it('should throw if a request fails', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Network error');
    });
    await expect(fetchUserProfiles(['1'])).rejects.toThrow('Network error');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});

describe('retryOperation', () => {
  it('should return result on first attempt', async () => {
    const op = jest.fn<Promise<string>, []>().mockResolvedValue('ok');
    const result: string = await retryOperation(op, 3);
    expect(result).toBe('ok');
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('should retry after error and succeed', async () => {
    const op = jest.fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error('Тимчасова помилка'))
      .mockResolvedValue('Успіх!');
    const promise: Promise<string> = retryOperation(op, 3);
    await jest.advanceTimersByTimeAsync(100);
    await expect(promise).resolves.toBe('Успіх!');
    expect(op).toHaveBeenCalledTimes(2);
    expect(logSpy).toHaveBeenCalledWith('Спроба 2...');
  });

  it('should throw last error after all attempts', async () => {
    const op = jest.fn<Promise<string>, []>()
      .mockRejectedValue(new Error('error'));
    const promise: Promise<string> = retryOperation(op, 3);
    const assertion = expect(promise).rejects.toThrow('error');
    await jest.advanceTimersByTimeAsync(300);
    await assertion;
    expect(op).toHaveBeenCalledTimes(3);
  });

  it('should use 3 attempts by default', async () => {
    const op = jest.fn<Promise<number>, []>()
      .mockRejectedValue(new Error('error'));
    const promise: Promise<number> = retryOperation(op);
    const assertion = expect(promise).rejects.toThrow('error');
    await jest.advanceTimersByTimeAsync(300);
    await assertion;
    expect(op).toHaveBeenCalledTimes(3);
  });
});

describe('processInBatches', () => {
  it('should process items in batches', async () => {
    const processor = jest.fn(async (batch: number[]) =>
      batch.map((n) => n * 2)
    );
    const items: number[] = [1, 2, 3, 4, 5, 6, 7, 8];
    const results: number[] = await processInBatches(items, 3, processor);
    expect(results).toEqual([2, 4, 6, 8, 10, 12, 14, 16]);
    expect(processor).toHaveBeenCalledTimes(3);
    expect(processor).toHaveBeenNthCalledWith(1, [1, 2, 3]);
    expect(processor).toHaveBeenNthCalledWith(3, [7, 8]);
  });

  it('should return empty array for empty items', async () => {
    const processor = jest.fn(async (batch: number[]) => batch);
    const results: number[] = await processInBatches([], 3, processor);
    expect(results).toEqual([]);
    expect(processor).not.toHaveBeenCalled();
  });

  it('should log progress', async () => {
    await processInBatches([1, 2, 3], 2, async (batch: number[]) => batch);
    expect(logSpy).toHaveBeenCalledWith('Обробка партії 1/2...');
    expect(logSpy).toHaveBeenCalledWith('Обробка партії 2/2...');
  });

  it('should work with generic types', async () => {
    const lengths: number[] = await processInBatches(
      ['a', 'bb', 'ccc'],
      2,
      async (batch: string[]) => batch.map((s) => s.length)
    );
    expect(lengths).toEqual([1, 2, 3]);
  });

  it('should throw if processor fails', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const processor = jest.fn().mockRejectedValue(new Error('batch error'));
    await expect(processInBatches([1, 2], 1, processor)).rejects.toThrow(
      'batch error'
    );
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe('raceWithTimeout', () => {
  it('should return result of fast operation', async () => {
    const fast: Promise<string> = delay(50).then(() => 'Готово');
    const promise: Promise<string> = raceWithTimeout(fast, 100);
    await jest.advanceTimersByTimeAsync(50);
    await expect(promise).resolves.toBe('Готово');
  });

  it('should throw on timeout', async () => {
    const slow: Promise<string> = delay(200).then(() => 'Готово');
    const assertion = expect(raceWithTimeout(slow, 100)).rejects.toThrow(
      'Operation timed out after 100ms'
    );
    await jest.advanceTimersByTimeAsync(100);
    await assertion;
  });
});
