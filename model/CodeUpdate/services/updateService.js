import { PluginPath } from "../../GitRepo.js"
import { Config } from "#components"
import { redisKey } from "../constants.js"
import { fetchCommits, fetchReleases } from "./repoService.js"
import { sendMessageToUser } from "./messageService.js"
import { generateScreenshot } from "./screenshotService.js"
import { logger } from "#lib"

class UpdateService {
  /**
   * 获取仓库更新
   * @param {boolean} isAuto 是否为自动获取
   * @param {object} e 消息事件
   * @returns {boolean|object} 是否有更新 | { number: number }
   */
  async checkUpdates(isAuto = false, e) {
    const { GithubToken = "", GiteeToken = "", GitcodeToken = "", List = [] } = Config.CodeUpdate

    if (!List.length) {
      logger.mark("[CodeUpdate] 未配置仓库信息，取消检查更新")
      return isAuto ? false : e.reply("还没有配置仓库信息呢")
    }

    logger.mark(logger.blue("开始检查仓库更新"))
    let totalUpdates = 0

    for (const repoConfig of List) {
      const updates = await this.checkRepoConfigUpdates(repoConfig, { GithubToken, GiteeToken, GitcodeToken }, isAuto, e)
      totalUpdates += updates
    }

    if (totalUpdates > 0) {
      logger.info(logger.green(`共获取到 ${totalUpdates} 条数据~`))
    } else {
      logger.info(logger.yellow("没有获取到任何数据"))
    }
    return { number: totalUpdates }
  }

  /**
   * 检查配置的多个平台（GitHub、Gitee、Gitcode）仓库和发布的更新。
   * @async
   * @param {object} repoConfig - 包含要检查的仓库和发布列表的配置对象。
   * @param {object} tokens - 各平台的认证 token。
   * @param {boolean} isAuto - 是否为自动触发的检查。
   * @param {object} e - 事件对象，包含用户和上下文信息。
   * @returns {Promise<number>} 返回获取到的更新条数。
   */
  async checkRepoConfigUpdates(repoConfig, tokens, isAuto, e) {
    const {
      GithubList = [],
      GiteeList = [],
      GitcodeList = [],
      GiteeReleases = [],
      GithubReleases = [],
      AutoPath = false,
      Exclude = [],
      Group = [],
      QQ = []
    } = repoConfig

    const githubRepos = this.getRepoList(GithubList, PluginPath.github, Exclude, AutoPath)
    const giteeRepos = this.getRepoList(GiteeList, PluginPath.gitee, Exclude, AutoPath)
    const gitcodeRepos = this.getRepoList(GitcodeList, PluginPath.gitcode, Exclude, AutoPath)

    const updateRequests = [
      { repos: githubRepos, platform: "GitHub", token: tokens.GithubToken, type: "commits", key: "GitHub" },
      { repos: giteeRepos, platform: "Gitee", token: tokens.GiteeToken, type: "commits", key: "Gitee" },
      { repos: gitcodeRepos, platform: "Gitcode", token: tokens.GitcodeToken, type: "commits", key: "Gitcode" },
      { repos: GiteeReleases, platform: "Gitee", token: tokens.GiteeToken, type: "releases", key: "GiteeReleases" },
      { repos: GithubReleases, platform: "GitHub", token: tokens.GithubToken, type: "releases", key: "GithubReleases" }
    ]

    const promises = updateRequests
      .filter(req => req.repos.length > 0)
      .map(req => this.fetchUpdateForRepo(req.repos, req.platform, req.token, req.type, req.key, isAuto))

    const results = await Promise.all(promises)
    const content = results.flat()
    if (content.length > 0) {
      const userId = isAuto ? "Auto" : e.user_id
      const base64 = await generateScreenshot(content, userId)
      sendMessageToUser(base64, content, Group, QQ, isAuto, e)
    }
    return content.length
  }

  getRepoList(list, pluginPath, exclude, autoPath) {
    if (!autoPath) return list
    return [ ...new Set([ ...list, ...pluginPath ]) ].filter(path => !exclude.includes(path))
  }

  async fetchUpdateForRepo(list, platform, token, type, key, isAuto) {
    if (!list.length) return []
    return type === "commits"
      ? fetchCommits(list, platform, token, `${redisKey}:${key}`, isAuto)
      : fetchReleases(list, platform, token, `${redisKey}:${key}`, isAuto)
  }
}

export default new UpdateService()
