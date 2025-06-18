/**
 * 检查指定仓库是否为最新，通过比较提供的 SHA 与 Redis 中存储的 SHA。
 * @async
 * @param {string} repo - 仓库名称或标识符。
 * @param {string} redisKeyPrefix - Redis 键的前缀。
 * @param {string} sha - 用于比对的 SHA 代码。
 * @returns {Promise<boolean>} 如果存储的 SHA 与提供的 SHA 匹配则返回 true，否则返回 false。
 */
async function isUpToDate(repo, redisKeyPrefix, sha) {
  const redisData = await redis.get(`${redisKeyPrefix}:${repo}`)
  return redisData && JSON.parse(redisData)[0].shacode === sha
}

/**
 * 根据是否自动更新，将指定的 SHA 码存储到 Redis。
 * @async
 * @function
 * @param {string} repo - 仓库名称。
 * @param {string} redisKeyPrefix - Redis 键前缀。
 * @param {string} sha - 要存储的 SHA 码。
 * @param {boolean} isAuto - 是否为自动更新，若为 true 则执行存储操作。
 * @returns {Promise<void>} ok?
 */
async function updatesSha(repo, redisKeyPrefix, sha, isAuto) {
  if (isAuto) {
    return redis.set(`${redisKeyPrefix}:${repo}`, JSON.stringify([ { shacode: sha } ]))
  }
}

export default { isUpToDate, updatesSha }
