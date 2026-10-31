"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = delay;
exports.fetchUserProfiles = fetchUserProfiles;
exports.retryOperation = retryOperation;
exports.processInBatches = processInBatches;
exports.raceWithTimeout = raceWithTimeout;
function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
async function fetchUserProfiles(userIds) {
    if (userIds.length === 0) {
        return [];
    }
    try {
        const requests = userIds.map(async (id) => {
            const ms = 50 + Math.floor(Math.random() * 101);
            await delay(ms);
            return { id, name: `User ${id}`, email: `user${id}@example.com` };
        });
        return await Promise.all(requests);
    }
    catch (error) {
        console.error('Помилка завантаження профілів:', error);
        throw error;
    }
}
async function retryOperation(operation, maxRetries = 3) {
    let lastError;
    for (let n = 1; n <= maxRetries; n++) {
        console.log(`Спроба ${n}...`);
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            if (n < maxRetries) {
                await delay(100);
            }
        }
    }
    throw lastError;
}
async function processInBatches(items, batchSize, processor) {
    const results = [];
    const total = Math.ceil(items.length / batchSize);
    for (let i = 0; i < items.length; i += batchSize) {
        const n = i / batchSize + 1;
        console.log(`Обробка партії ${n}/${total}...`);
        const batch = items.slice(i, i + batchSize);
        try {
            const batchResult = await processor(batch);
            results.push(...batchResult);
        }
        catch (error) {
            console.error(`Помилка в партії ${n}:`, error);
            throw error;
        }
    }
    return results;
}
async function raceWithTimeout(promise, timeoutMs) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => {
            reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });
    try {
        return await Promise.race([promise, timeout]);
    }
    finally {
        clearTimeout(timer);
    }
}
//# sourceMappingURL=lab1.js.map