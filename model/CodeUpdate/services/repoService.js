import lodash from "lodash"
import redisHeler from "../utils/redisHelper.js"
import { formatCommitInfo, formatReleaseInfo } from "./formatService.js"
import { GitApi } from "../../api/index.js"
import { AutoPathBranch } from "../constants.js"
import { logger } from "#lib"

/**
 * 获取指定仓库列表的提交记录。
 * @param {string[]} repoList 仓库标识符列表。
 * @param {string} source 源平台（如 GitHub、Gitee）。
 * @param {string|string[]} token 用于认证的 API 令牌。
 * @param {string} redisKeyPrefix Redis 缓存键的前缀。
 * @param {boolean} isAuto 是否为自动更新检查。
 * @returns {Promise<object[]>} 处理后的更新信息数组。
 */
export const fetchCommits = (repoList, source, token, redisKeyPrefix, isAuto) =>
  fetchUpdates(repoList, source, token, "commits", redisKeyPrefix, isAuto)

/**
 * 获取指定仓库列表的发行记录。
 * @param {string[]} repoList 仓库标识符列表。
 * @param {string} source 源平台（如 GitHub、Gitee）。
 * @param {string|string[]} token 用于认证的 API 令牌。
 * @param {string} redisKeyPrefix Redis 缓存键的前缀。
 * @param {boolean} isAuto 是否为自动更新检查。
 * @returns {Promise<object[]>} 处理后的更新信息数组。
 */
export const fetchReleases = (repoList, source, token, redisKeyPrefix, isAuto) =>
  fetchUpdates(repoList, source, token, "releases", redisKeyPrefix, isAuto)

/**
 * 从仓库列表中获取更新（提交或发布），并进行处理。
 * @param {string[]} repoList 仓库标识符列表。
 * @param {string} source 源平台（如 GitHub、Gitee）。
 * @param {string|string[]} token 用于认证的 API 令牌。
 * @param {string} type 要获取的数据类型（"commits" 或 "releases"）。
 * @param {string} redisKeyPrefix Redis 缓存键的前缀。
 * @param {boolean} isAuto 是否为自动更新检查。
 * @returns {Promise<object[]>} 处理后的更新信息数组。
 */
async function fetchUpdates(repoList, source, token, type, redisKeyPrefix, isAuto) {
  const content = []
  await Promise.all(repoList.map(async(repo) => {
    if (!repo) return
    try {
      logger.debug(`请求 ${logger.magenta(source)} ${type}: ${logger.cyan(repo)}`)
      let [ path, branch ] = type === "commits" ? repo.split(":") : [ repo ]
      if (!branch) branch = AutoPathBranch[path]
      if (Array.isArray(token)) token = lodash.sample(token)
      let data = await GitApi.getRepositoryData(path, source, type, token, branch)
      if (data === "return") return
      if (!data || [ "Not Found Projec", "Not Found" ].includes(data?.message)) {
        logger.error(`${logger.magenta(source)}: ${logger.cyan(repo)} 仓库不存在`)
        return
      }
      if (type === "commits" && branch) data = [ data ]
      if (data.length === 0 || (type === "releases" && !data[0]?.tag_name)) {
        logger.warn(`${logger.magenta(source)}: ${logger.cyan(repo)} 数据为空`)
        return
      }
      if (isAuto) {
        const id = type === "commits" ? data[0]?.sha : data[0]?.node_id
        if (await redisHeler.isUpToDate(repo, redisKeyPrefix, id)) {
          logger.debug(`${logger.cyan(repo)} 暂无更新`)
          return
        }
        logger.mark(`${logger.cyan(repo)} 检测到更新`)
        await redisHeler.updatesSha(repo, redisKeyPrefix, id, isAuto)
      }
      const info = type === "commits"
        ? formatCommitInfo(data[0], source, path, branch)
        : formatReleaseInfo(data[0], source, repo)
      content.push(info)
    } catch (error) {
      logger.error(` 获取 ${logger.magenta(source)} ${type} ${logger.cyan(repo)} 数据出错: ${error?.stack || error}`)
    }
  }))
  return content
}
