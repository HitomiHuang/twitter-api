const { redisClient, connectRedis } = require('./redisClient');

async function cacheWrapper(key, loaderFn, ttl = 60) {
  await connectRedis();

  // 嘗試取得 Redis 快取
  const cached = await redisClient.get(key);
  if (cached) {
    console.log(`✅ [Cache Hit] ${key}`);
    return JSON.parse(cached);
  }

  // 呼叫 loader 函式查資料
  const data = await loaderFn();

  // 寫入快取
  await redisClient.set(key, JSON.stringify(data), { EX: ttl });
  console.log(`📝 [Cache Set] ${key}`);

  return data;
}

async function invalidateCache(key) {
  await connectRedis();
  await redisClient.del(key);
  console.log(`🚫 [Cache Invalidate] ${key}`);
}

module.exports = { cacheWrapper, invalidateCache};