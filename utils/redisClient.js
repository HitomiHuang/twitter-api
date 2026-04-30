const { createClient } = require('redis');

const redisClient = createClient({
  url: 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};


module.exports = {
  redisClient,
  connectRedis
};
