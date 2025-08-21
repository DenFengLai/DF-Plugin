import { PluginPath } from "../../GitRepo/index.js"
import { Config } from "#components"
import { redisKey } from "../constants.js"
import { fetchCommits, fetchReleases } from "./repo.js"
import { sendMessageToUser } from "./message.js"
import { generateScreenshot } from "./screenshot.js"
import { logger } from "#lib"
import { redisHeler } from "../utils/index.js"

class UpdateService {
  constructor() {
    this.redisKey = redisKey
    this.updatesMap = new Map()
  }

  async checkUpdates(isAuto = false, e) {
    const { List = [], repos = [] } = Config.CodeUpdate
    if (!List.length) {
      logger.mark("[CodeUpdate] 未配置仓库信息，取消检查更新")
      return isAuto ? false : e.reply("还没有配置仓库信息呢")
    }

    logger.mark(logger.blue("开始检查仓库更新"))

    const tokens = Object.fromEntries(repos.map(({ provider, token }) => [ provider, token ]))

    await this.collectAllUpdates(List, tokens, isAuto)

    let totalSent = 0
    for (const cfg of List) {
      const sent = await this.deliverUpdatesForConfig(cfg, isAuto, e)
      totalSent += sent
    }

    logger.info(
      totalSent > 0
        ? logger.green(`共推送 ${totalSent} 条更新`)
        : logger.yellow("没有需要推送的更新")
    )

    return { number: totalSent }
  }

  async collectAllUpdates(configList, tokens, isAuto) {
    this.updatesMap.clear()

    const groups = {}

    for (const { AutoPath = false, repos = [], Exclude = [] } of configList) {
      const repoList = this.buildRepoList(repos, AutoPath, Exclude)
      for (const [ platform, types ] of Object.entries(repoList)) {
        groups[platform] ??= {}
        for (const [ type, repoPaths ] of Object.entries(types)) {
          groups[platform][type] ??= new Set()
          for (const rp of repoPaths) groups[platform][type].add(rp)
        }
      }
    }

    for (const [ platform, types ] of Object.entries(groups)) {
      for (const [ type, repoPathSet ] of Object.entries(types)) {
        const repoPaths = [ ...repoPathSet ]
        if (!repoPaths.length) continue

        const token = tokens[platform]
        const fetcher = type === "commits" ? fetchCommits : fetchReleases
        const key = redisHeler.getRedisKey(platform, type)

        try {
          const results = await fetcher(repoPaths, platform, token, key, isAuto)
          if (Array.isArray(results) && results.length > 0) {
            for (const item of results) {
              const name = item.name || {}
              const source = name.source || platform
              const isRelease = Boolean(name.tag) || type === "releases"
              const typeKey = isRelease ? "releases" : "commit"
              const repo = name.repo || item.repo || ""
              const branch = name.branch || item.branch || ""
              const mapKey = `${source}:${typeKey}:${repo}${branch ? `:${branch}` : ""}`

              const existing = this.updatesMap.get(mapKey)
              if (!existing) {
                this.updatesMap.set(mapKey, [ item ])
              } else {
                existing.push(item)
                this.updatesMap.set(mapKey, existing)
              }
            }
          }
        } catch (err) {
          logger.error(`[CodeUpdate] 拉取 ${platform}/${type} 更新失败: ${err?.message || err}`)
        }
      }
    }
  }

  async deliverUpdatesForConfig({ AutoPath = false, repos = [], Exclude = [], Group = [], QQ = [] }, isAuto, e) {
    const repoList = this.buildRepoList(repos, AutoPath, Exclude)

    const keys = []
    for (const [ platform, types ] of Object.entries(repoList)) {
      for (const [ type, repoPaths ] of Object.entries(types)) {
        for (const repoPath of repoPaths) {
          const [ repo, branch ] = repoPath.split(":")
          const typeKey = type === "commits" ? "commit" : "releases"
          const mapKey = `${platform}:${typeKey}:${repo}${branch ? `:${branch}` : ""}`
          keys.push(mapKey)
        }
      }
    }

    const content = []
    const deliverMarkPairs = []
    const groupSignature = (Group && Group.length) ? `group:${Group.join(",")}` : (QQ && QQ.length ? `qq:${QQ.join(",")}` : "group:default")

    for (const key of keys) {
      if (!this.updatesMap.has(key)) continue
      const items = this.updatesMap.get(key) || []
      for (const item of items) {
        const updateId = this.getUpdateId(item)
        const deliveredKey = this.makeDeliveredKey(key, groupSignature)

        const already = await redisHeler.isUpToDate(deliveredKey, key, updateId)
        if (already) {
          continue
        }

        content.push(item)
        deliverMarkPairs.push({ deliveredKey, updateId })
      }
    }

    if (content.length === 0) return 0

    const userId = isAuto ? "Auto" : (e && e.user_id) || "Unknown"
    try {
      const base64 = await generateScreenshot(content, userId)
      await sendMessageToUser(base64, content, Group, QQ, isAuto, e)

      for (const { deliveredKey, updateId } of deliverMarkPairs) {
        try {
          await redisHeler.updatesSha(deliveredKey, "", updateId, isAuto)
        } catch (err) {
          logger.warn(`[CodeUpdate] 写 delivered 标记失败: ${deliveredKey} -> ${updateId}`)
        }
      }

      return content.length
    } catch (err) {
      logger.error(`[CodeUpdate] 推送失败: ${err?.message || err}`)
      return 0
    }
  }

  getUpdateId(item) {
    if (!item) return ""
    if (item.sha) return item.sha
    if (item.tag) return item.tag
    if (item.name && item.name.tag) return item.name.tag
    if (item.id) return String(item.id)
    try {
      return JSON.stringify(item.name || item)
    } catch {
      return String(Date.now())
    }
  }

  makeDeliveredKey(mapKey, groupSignature) {
    return `${this.redisKey?.delivered ?? "codeupdate:delivered"}:${mapKey}:to:${groupSignature}`
  }

  buildRepoList(repos = [], autoPath = false, exclude = []) {
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

  getRepoList(repoPaths = [], pluginPath = [], exclude = [], autoPath) {
    if (!autoPath) return repoPaths
    return [ ...new Set([ ...repoPaths, ...pluginPath ]) ].filter(path => !exclude.includes(path))
  }
}

export default new UpdateService()
