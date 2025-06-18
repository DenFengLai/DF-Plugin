/* eslint-disable promise/always-return */
import { Config } from "#components"
import { GitApi } from "../../api/index.js"
import { AutoPathBranch } from "../constants.js"
export async function autoFillDefaultBranches() {
  let num = 0
  const promises = []
  if (!Config.CodeUpdate.AutoBranch) return

  for (const item of Config.CodeUpdate.List || []) {
    for (const [ platform, token, listKey ] of [
      [ "GitHub", Config.CodeUpdate.GithubToken, "GithubList" ],
      [ "Gitee", Config.CodeUpdate.GiteeToken, "GiteeList" ],
      [ "Gitcode", Config.CodeUpdate.GitcodeToken, "GitcodeList" ]
    ]) {
      const repoList = item[listKey] || []
      for (let idx = 0; idx < repoList.length; idx++) {
        const path = repoList[idx]
        if (!path.split(":")?.[1]) {
          const repo = path.split(":")[0]
          promises.push(
            GitApi.getDefaultBranch(repo, platform, token)
              .then((branch) => {
                if (!branch) throw new Error(`接口返回分支为空 ${branch}`)
                AutoPathBranch[repo] = branch
                item[listKey][idx] = `${repo}:${branch}`
                num++
              })
              .catch((error) => {
                logger.warn(`[DF-Plugin] 获取${platform}的默认分支失败 ${repo}: ${error.message}`)
              })
          )
        }
      }
    }
  }

  try {
    await Promise.all(promises)
    if (num > 0) {
      logger.info(`[DF-Plugin] 已自动获取到 ${logger.blue(num)} 个默认分支`)
    }
  } catch (error) {
    logger.error(`[DF-Plugin] 获取默认分支时发生错误: ${error.message}`)
  }
}
