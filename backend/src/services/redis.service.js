const redis = require('../config/redis');

const cacheTodos = (userId, todos) =>
  redis.setex(`todos:${userId}`, 300, JSON.stringify(todos));

const getCachedTodos = async (userId) => {
  const data = await redis.get(`todos:${userId}`);
  return data ? JSON.parse(data) : null;
};

const invalidateTodosCache = (userId) => redis.del(`todos:${userId}`);


const blacklistToken = (token, ttlSeconds) =>
  redis.setex(`bl:${token}`, ttlSeconds, '1');

const isTokenBlacklisted = async (token) =>
  (await redis.get(`bl:${token}`)) === '1';


const storeMFATempToken = (userId, token) =>
  redis.setex(`mfatemp:${userId}`, 300, token);

const getMFATempToken = (userId) => redis.get(`mfatemp:${userId}`);
const deleteMFATempToken = (userId) => redis.del(`mfatemp:${userId}`);


const incrementLoginAttempts = async (email) => {
  const key = `login_attempts:${email}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 900);
  return count;
};

const resetLoginAttempts = (email) => redis.del(`login_attempts:${email}`);

module.exports = {
  cacheTodos, getCachedTodos, invalidateTodosCache,
  blacklistToken, isTokenBlacklisted,
  storeMFATempToken, getMFATempToken, deleteMFATempToken,
  incrementLoginAttempts, resetLoginAttempts,
};
