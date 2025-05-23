/* eslint-disable promise/always-return */
import moment from "moment"
import common from "../../../lib/common/common.js"
import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import { GitApi } from "./api/index.js"
import { PluginPath } from "#model"
import { Config, Res_Path, common as Common } from "#components"
import { marked } from "marked"
import lodash from "lodash"

const _key = "DF:CodeUpdate"
let AutoPathBranch = {}

export default new class CodeUpdate {
  /**
   * 获取仓库更新
   * @param {boolean} isAuto 是否为自动获取
   * @param {object} e 消息事件
   * @returns {boolean|object} 是否有更新 | { number: number }
   */
  async checkUpdates(isAuto = false, e) {
    const { GithubToken = "", GiteeToken = "", GitcodeToken = "", List = [] } = Config.CodeUpdate

    if (!List.length) {
      logger.mark("[DF-Plugin][CodeUpdate]没有配置仓库信息，取消检查更新")
      return isAuto ? false : e.reply("还没有配置仓库信息呢")
    }

    logger.mark(logger.blue("开始检查仓库更新"))

    let number = 0

    for (const list of List) {
      const promises = []
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
      } = list

      const githubRepos = this.getRepoList(GithubList, PluginPath.github, Exclude, AutoPath)
      const giteeRepos = this.getRepoList(GiteeList, PluginPath.gitee, Exclude, AutoPath)
      const gitcodeRepos = this.getRepoList(GitcodeList, PluginPath.gitcode, Exclude, AutoPath)

      const updateRequests = [
        { list: githubRepos, platform: "GitHub", token: GithubToken, type: "commits", key: "GitHub" },
        { list: giteeRepos, platform: "Gitee", token: GiteeToken, type: "commits", key: "Gitee" },
        { list: gitcodeRepos, platform: "Gitcode", token: GitcodeToken, type: "commits", key: "Gitcode" },
        { list: GiteeReleases, platform: "Gitee", token: GiteeToken, type: "releases", key: "GiteeReleases" },
        { list: GithubReleases, platform: "GitHub", token: GithubToken, type: "releases", key: "GithubReleases" }
      ]

      updateRequests.forEach(({ list, platform, token, type, key }) => {
        if (list.length > 0) {
          promises.push(this.fetchUpdateForRepo(list, platform, token, type, key, isAuto))
        }
      })

      const results = await Promise.all(promises)
      const content = results.flat()

      if (content.length > 0) {
        number += content.length
        const userId = isAuto ? "Auto" : e.user_id
        const base64 = await this.generateScreenshot(content, userId)
        this.sendMessageToUser(base64, content, Group, QQ, isAuto, e)
      }
    }

    if (number > 0) {
      logger.info(logger.green(`共获取到 ${number} 条数据~`))
    } else {
      logger.info(logger.yellow("没有获取到任何数据"))
    }
    return { number }
  }

  getRepoList(list, pluginPath, exclude, autoPath) {
    return autoPath ? [ ...new Set([ ...list, ...pluginPath ]) ].filter(path => !exclude.includes(path)) : list
  }

  async fetchUpdateForRepo(list, platform, token, type, key, isAuto) {
    if (list.length > 0) {
      return this.fetchUpdates(list, platform, token, type, `${_key}:${key}`, isAuto)
    }
    return []
  }

  async fetchUpdates(repoList, source, token, type, redisKeyPrefix, isAuto) {
    const content = []

    await Promise.all(repoList.map(async(repo) => {
      if (!repo) return

      try {
        logger.debug(`请求 ${logger.magenta(source)} ${type}: ${logger.cyan(repo)}`)

        let [ path, branch ] = type === "commits" ? repo.split(":") : [ repo ]
        if (!branch) branch = AutoPathBranch[path] // || (await GitApi.getDefaultBranch(path, source, token))
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
          if (await this.isUpToDate(repo, redisKeyPrefix, id)) {
            logger.debug(`${logger.cyan(repo)} 暂无更新`)
            return
          }
          logger.mark(`${logger.cyan(repo)} 检测到更新`)
          await this.updateRedis(repo, redisKeyPrefix, id, isAuto)
        }

        const info = type === "commits" ? this.formatCommitInfo(data[0], source, path, branch) : this.formatReleaseInfo(data[0], source, repo)
        content.push(info)
      } catch (error) {
        logger.error(`[DF-Plugin] 获取 ${logger.magenta(source)} ${type} ${logger.cyan(repo)} 数据出错: ${error?.stack || error}`)
      }
    }))

    return content
  }

  async isUpToDate(repo, redisKeyPrefix, sha) {
    const redisData = await redis.get(`${redisKeyPrefix}:${repo}`)
    return redisData && JSON.parse(redisData)[0].shacode === sha
  }

  async updateRedis(repo, redisKeyPrefix, sha, isAuto) {
    if (isAuto) {
      await redis.set(`${redisKeyPrefix}:${repo}`, JSON.stringify([ { shacode: sha } ]))
    }
  }

  formatCommitInfo(data, source, repo, branch) {
    const { author, committer, commit, stats, files } = data
    const authorName = `<span>${commit.author.name}</span>`
    const committerName = `<span>${commit.committer.name}</span>`
    const authorTime = `<span>${Common.timeAgo(moment(commit.author.date))}</span>`
    const committerTime = `<span>${Common.timeAgo(moment(commit.committer.date))}</span>`
    const timeInfo = authorName === committerName ? `${authorName} 提交于 ${authorTime}` : `${authorName} 编写于 ${authorTime}，并由 ${committerName} 提交于 ${committerTime}`

    return {
      avatar: {
        is: author?.avatar_url !== committer?.avatar_url,
        author: author?.avatar_url,
        committer: committer?.avatar_url
      },
      name: {
        source,
        repo,
        branch,
        authorStart: commit.author.name?.[0] ?? "?",
        committerStart: commit.committer.name?.[0] ?? "?"
      },
      time_info: timeInfo,
      text: this.formatMessage(commit.message),
      stats: stats && files ? { files: files.length, additions: stats.additions, deletions: stats.deletions } : false
    }
  }

  formatMessage(message) {
    const msgMap = message.split("\n")
    msgMap[0] = "<span class='head'>" + msgMap[0] + "</span>"
    return msgMap.join("\n")
  }

  formatReleaseInfo(data, source, repo) {
    const { tag_name, name, body, author, published_at } = data
    const authorName = `<span>${author?.login || author?.name}</span>`
    const authorAvatar = author?.avatar_url
    const authorTime = `<span>${Common.timeAgo(moment(published_at))}</span>`
    const timeInfo = authorName ? `${authorName} 发布于 ${authorTime}` : `${authorTime}`

    return {
      release: true,
      avatar: authorAvatar,
      name: {
        source,
        repo,
        tag: tag_name,
        authorStart: author?.login?.[0] || author?.name?.[0] || "?"
      },
      time_info: timeInfo,
      text: "<span class='head'>" + name + "</span>\n" + marked(body)
    }
  }

  async generateScreenshot(content, saveId) {
    return await puppeteer.screenshot("CodeUpdate/index", {
      tplFile: `${Res_Path}/CodeUpdate/index.html`,
      saveId,
      lifeData: content,
      pluResPath: `${Res_Path}/`
    })
  }

  async sendMessageToUser(data, content, Group, QQ, isAuto, e) {
    if (!isAuto) return e.reply(data)
    for (const group of Group) {
      if (content.length > 0 && data) {
        Bot.pickGroup(group).sendMsg(data)
      }
      await common.sleep(5000)
    }
    for (const qq of QQ) {
      if (content.length > 0 && data) {
        Bot.pickFriend(qq).sendMsg(data)
      }
      await common.sleep(5000)
    }
  }
}()

/** 对未设置分支的仓库进行处理 */
let num = 0
const promises = []
if (Config.CodeUpdate.AutoBranch) {
  Config.CodeUpdate.List?.length > 0 && Config.CodeUpdate.List.forEach((item) => {
    const { GithubList = [], GiteeList = [], GitcodeList = [] } = item
    if (GithubList.length > 0) {
      GithubList.forEach((path, idx) => {
        if (!path.split(":")?.[1]) {
          promises.push(
            GitApi.getDefaultBranch(path.split(":")[0], "GitHub", Config.CodeUpdate.GithubToken)
              .then((branch) => {
                const repo = path.split(":")[0]
                AutoPathBranch[repo] = branch
                item.GithubList[idx] = `${repo}:${branch}`
                num++
              })
              .catch((error) => {
                logger.warn(`[DF-Plugin] 获取Github的默认分支失败 ${path.split(":")[0]}: ${error.message}`)
              })
          )
        }
      })
    }
    if (GiteeList.length > 0) {
      GiteeList.forEach((path, idx) => {
        if (!path.split(":")?.[1]) {
          promises.push(
            GitApi.getDefaultBranch(path.split(":")[0], "Gitee", Config.CodeUpdate.GiteeToken)
              .then((branch) => {
                const repo = path.split(":")[0]
                AutoPathBranch[repo] = branch
                item.GiteeList[idx] = `${repo}:${branch}`
                num++
              })
              .catch((error) => {
                logger.warn(`[DF-Plugin] 获取Gitee仓库的默认分支失败 ${path.split(":")[0]}: ${error.message}`)
              })
          )
        }
      })
    }
    if (GitcodeList.length > 0) {
      GitcodeList.forEach((path, idx) => {
        if (!path.split(":")?.[1]) {
          promises.push(
            GitApi.getDefaultBranch(path.split(":")[0], "Gitcode", Config.CodeUpdate.GitcodeToken)
              .then((branch) => {
                const repo = path.split(":")[0]
                AutoPathBranch[repo] = branch
                item.GitcodeList[idx] = `${repo}:${branch}`
                num++
              })
              .catch((error) => {
                logger.warn(`[DF-Plugin] 获取GitCode仓库默认分支失败 ${path.split(":")[0]}: ${error.message}`)
              })
          )
        }
      })
    }
  })

  Promise.all(promises)
    .then(() => {
      if (num > 0) {
        logger.info(`[DF-Plugin] 已自动获取到 ${logger.blue(num)} 个默认分支`)
      }
    })
    .catch((error) => {
      logger.error(`[DF-Plugin] 获取默认分支时发生错误: ${error.message}`)
    })
}
