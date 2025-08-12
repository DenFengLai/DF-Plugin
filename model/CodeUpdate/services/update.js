import { PluginPath } from "../../GitRepo/index.js"
import { Config } from "#components"
import { redisKey } from "../constants.js"
import { fetchCommits, fetchReleases } from "./repo.js"
import { sendMessageToUser } from "./message.js"
import { generateScreenshot } from "./screenshot.js"
import { logger } from "#lib"

class UpdateService {
  redisKey = redisKey
  /**
   * 检查所有配置仓库的更新情况
   * @param {boolean} [isAuto] 是否为自动触发的检查
   * @param {object} e 消息事件对象
   * @returns {Promise<false | { number: number }>} 自动模式下返回 false 或更新数量对象
   */
  async checkUpdates(isAuto = false, e) {
    const { List = [], repos = [] } = Config.CodeUpdate
    if (!List.length) {
      logger.mark("[CodeUpdate] 未配置仓库信息，取消检查更新")
      return isAuto ? false : e.reply("还没有配置仓库信息呢")
    }

    logger.mark(logger.blue("开始检查仓库更新"))

    /** @type {Record<string, string>} */
    const tokens = Object.fromEntries(repos.map(({ provider, token }) => [ provider, token ]))
    let totalUpdates = 0

    for (const repoConfig of List) {
      totalUpdates += await this.checkRepoConfigUpdates(repoConfig, tokens, isAuto, e)
    }

    logger.info(
      totalUpdates > 0
        ? logger.green(`共获取到 ${totalUpdates} 条数据~`)
        : logger.yellow("没有获取到任何数据")
    )

    return { number: totalUpdates }
  }

  /**
   * 检查单个仓库配置中的所有仓库更新
   * @param {object} repoConfig 仓库配置对象
   * @param {boolean} [repoConfig.AutoPath] 是否自动获取路径
   * @param {Array<{provider: string, repo: string, branch?: string, type: "commit" | "release"}>} [repoConfig.repos] 仓库信息列表
   * @param {string[]} [repoConfig.Exclude] 排除的仓库路径
   * @param {string[]} [repoConfig.Group] 群聊 ID 列表
   * @param {string[]} [repoConfig.QQ] QQ 用户 ID 列表
   * @param {Record<string, string>} tokens 各平台 token
   * @param {boolean} isAuto 是否自动触发
   * @param {object} e 消息事件对象
   * @returns {Promise<number>} 返回获取到的更新条数
   */
  async checkRepoConfigUpdates(
    { AutoPath = false, repos = [], Exclude = [], Group = [], QQ = [] },
    tokens,
    isAuto,
    e
  ) {
    const repoList = this.buildRepoList(repos, AutoPath, Exclude)

    /** @type {Array<{repos: string[], platform: string, token: string, type: string, key: string}>} */
    const updateRequests = Object.entries(repoList).flatMap(([ platform, types ]) =>
      Object.entries(types).map(([ type, repoPaths ]) => ({
        repos: this.getRepoList(repoPaths, PluginPath?.[platform], Exclude, AutoPath),
        platform,
        token: tokens[platform],
        type,
        key: this.getRedisKey(platform, type)
      }))
    )

    const results = await Promise.all(
      updateRequests
        .filter(({ repos }) => repos.length > 0)
        .map(({ repos, platform, token, type, key }) =>
          this.fetchUpdateForRepo(repos, platform, token, type, key, isAuto)
        )
    )

    const content = results.flat()

    if (content.length > 0) {
      const userId = isAuto ? "Auto" : e.user_id
      const base64 = await generateScreenshot(content, userId)
      sendMessageToUser(base64, content, Group, QQ, isAuto, e)
    }

    return content.length
  }

  /**
   * 根据手动配置或 AutoPath 构建仓库列表
   * @param {Array<{provider: string, repo: string, branch?: string, type: "commit" | "release"}>} repos 仓库列表
   * @param {boolean} autoPath 是否启用自动路径
   * @param {string[]} exclude 排除的仓库路径
   * @returns {Record<string, {commits?: string[], releases?: string[]}>} 返回按平台分组的仓库路径列表
   */
  buildRepoList(repos, autoPath, exclude) {
    let acc = {}

    if (repos.length > 0) {
      acc = repos.reduce((acc, { provider, repo, branch, type }) => {
        const typeKey = type === "commit" ? "commits" : "releases"
        const repoWithBranch = branch ? `${repo}:${branch}` : repo
        acc[provider] ??= {}
        acc[provider][typeKey] ??= []
        acc[provider][typeKey].push(repoWithBranch)
        return acc
      }, {})
    }

    if (autoPath) {
      for (const provider of Object.keys(PluginPath)) {
        acc[provider] ??= {}
        acc[provider].commits ??= []
        acc[provider].commits.push(...this.getRepoList([], PluginPath[provider], exclude, autoPath))
      }
    }

    return acc
  }

  /**
   * 合并 repoPaths 与 pluginPath，并排除 exclude 中的路径
   * @param {string[]} repoPaths 已有仓库路径
   * @param {string[]} [pluginPath] 插件路径列表
   * @param {string[]} exclude 排除的路径
   * @param {boolean} autoPath 是否自动路径模式
   * @returns {string[]} 返回合并后的仓库路径数组
   */
  getRepoList(repoPaths, pluginPath = [], exclude, autoPath) {
    if (!autoPath) return repoPaths
    return [ ...new Set([ ...repoPaths, ...pluginPath ]) ].filter(path => !exclude.includes(path))
  }

  /**
   * 获取单个仓库对应的 redis key
   * @param {string} platform 平台名（如 github, gitee）
   * @param {string} type 更新类型（commits 或 releases）
   * @param {string} [repoPath] 仓库路径（可选），用来生成完整 key
   * @returns {string} 返回 redis key
   */
  getRedisKey(platform, type, repoPath = "") {
    const prefix = type === "commits"
      ? `${redisKey}:${platform}`
      : `${redisKey}:${platform}${type[0].toUpperCase()}${type.slice(1)}`

    return repoPath ? `${prefix}:${repoPath}` : prefix
  }

  /**
   * 获取所有仓库的 redis key（去重）
   * @param fullKey 是否返回完整key
   * @returns {string[]} 返回所有 redis key 数组
   */
  getAllRedisKeys(fullKey = false) {
    const { List = [] } = Config.CodeUpdate
    const keys = new Set()

    for (const { AutoPath = false, repos = [] } of List) {
      const repoList = this.buildRepoList(repos, AutoPath, [])

      for (const [ platform, types ] of Object.entries(repoList)) {
        for (const [ type, repoPaths ] of Object.entries(types)) {
          if (fullKey) {
            for (const repoPath of repoPaths) {
              keys.add(this.getRedisKey(platform, type, repoPath))
            }
          } else {
            keys.add(this.getRedisKey(platform, type))
          }
        }
      }
    }

    return [ ...keys ]
  }

  /**
   * 获取指定仓库的更新内容
   * @param {string[]} repoPaths 仓库路径数组
   * @param {string} platform 平台名（如 github, gitee）
   * @param {string} token 平台 API token
   * @param {string} type 更新类型（commits 或 releases）
   * @param {string} key redis key
   * @param {boolean} isAuto 是否自动模式
   * @returns {Promise<object[]>} 返回更新内容数组
   */
  async fetchUpdateForRepo(repoPaths, platform, token, type, key, isAuto) {
    if (!repoPaths.length) return []
    const fetcher = type === "commits" ? fetchCommits : fetchReleases
    return fetcher(repoPaths, platform, token, key, isAuto)
  }
}

export default new UpdateService()
