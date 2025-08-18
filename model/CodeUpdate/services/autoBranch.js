/* eslint-disable promise/always-return */
import { Config } from "#components"
import { GitApi } from "../../api/index.js"
import { AutoPathBranch } from "../constants.js"
import { logger } from "#lib"
import { getToken } from "../utils/index.js"

/**
 * 检查并自动获取仓库默认分支
 * @param {object} repoObj 配置对象
 * @returns {boolean}
 */
async function fetchDefaultBranch(repoObj) {
  const { provider, repo, branch, type } = repoObj
  if (type !== "commit") return false
  if (branch) return false

  try {
    const token = getToken(provider)
    const defaultBranch = await GitApi.getDefaultBranch(repo, provider, token)

    if (!defaultBranch) throw new Error(`接口返回分支为空 ${defaultBranch}`)
    if (defaultBranch === "return") return false

    AutoPathBranch[repo] = defaultBranch
    repoObj.branch = defaultBranch
    return true
  } catch (error) {
    logger.warn(`获取 ${provider} 的默认分支失败 ${repo}: ${error.message}`)
    return false
  }
}

/** 自动获取默认分支 */
export async function autoFillDefaultBranches() {
  if (!Config.CodeUpdate.AutoBranch) return

  const allRepos = (Config.CodeUpdate.List || [])
    .flatMap(item => item.repos || [])

  const results = await Promise.all(allRepos.map(fetchDefaultBranch))
  const num = results.filter(Boolean).length

  if (num > 0) {
    logger.info(`已自动获取到 ${logger.blue(num)} 个默认分支`)
  }
}
