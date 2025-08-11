import fs from "node:fs/promises"
import path from "node:path"
import { exec } from "child_process"
import { Path, Config } from "#components"
import { logger } from "#lib"

/**
 * 插件远程路径，包含 GitHub、Gitee 和 GitCode
 * @type {{ GitHub: string[], Gitee: string[], Gitcode: string[] }}
 */
export const PluginPath = { GitHub: [], Gitee: [], Gitcode: [] }

// 初始化常量
if (Config.AutoPath) loadLocalPlugins()

/**
 * 加载本地 Git 仓库并填充 PluginPath
 * @returns {Promise<void>}
 */
async function loadLocalPlugins() {
  console.time("[DF-Plugin] 载入本地Git仓库列表")
  try {
    const { github, gitee, gitcode } = await findRepos(Path)
    PluginPath.GitHub.push(...github)
    PluginPath.Gitee.push(...gitee)
    PluginPath.Gitcode.push(...gitcode)
  } catch (err) {
    logger.error("加载本地Git仓库时出错:", err)
  } finally {
    console.timeEnd("[DF-Plugin] 载入本地Git仓库列表")
  }
}

/**
 * 遍历目录并收集 Git 仓库信息
 * @param {string} rootDir - 根目录路径
 * @returns {Promise<{ github: string[], gitee: string[], gitcode: string[] }>} 收集到的仓库列表
 */
async function findRepos(rootDir) {
  const result = { github: [], gitee: [], gitcode: [] }
  await traverse(rootDir, result)
  return result
}

// 忽略的目录列表
const IGNORE = new Set([ "data", "node_modules", "temp", "logs", "cache", "dist" ])

/**
 * 递归遍历目录以查找 Git 仓库
 * @param {string} dir - 当前遍历的目录路径
 * @param {{ github: string[], gitee: string[], gitcode: string[] }} result - 收集结果对象
 * @returns {Promise<void>}
 */
async function traverse(dir, result) {
  try {
    if (await isGitRepo(dir)) {
      await collectRepoInfo(dir, result)
    }

    for (const dirent of await fs.readdir(dir, { withFileTypes: true })) {
      if (IGNORE.has(dirent.name)) continue
      if (dirent.isDirectory()) {
        const sub = path.join(dir, dirent.name)
        await traverse(sub, result)
      }
    }
  } catch (err) {
    logger.error(`无法扫描文件夹: ${dir}`, err)
  }
}

/**
 * 收集单个仓库的远程信息
 * @param {string} repoDir - 仓库本地路径
 * @param {{ github: string[], gitee: string[], gitcode: string[] }} result - 收集结果对象
 * @returns {Promise<void>}
 */
async function collectRepoInfo(repoDir, result) {
  try {
    const branch = await execCmd(repoDir, "git branch --show-current")
    const remoteName = await execCmd(repoDir, `git config branch.${branch}.remote`)
    const url = await execCmd(repoDir, `git remote get-url ${remoteName}`)
    classify(url.trim(), branch, result)
  } catch (err) {
    logger.warn(`Git仓库信息收集失败: ${repoDir}`, err)
  }
}

/**
 * 判断是否为 Git 仓库
 * @param {string} dir - 待检查目录路径
 * @returns {Promise<boolean>} 若包含 .git 则返回 true
 */
async function isGitRepo(dir) {
  try {
    await fs.access(path.join(dir, ".git"))
    return true
  } catch {
    return false
  }
}

/**
 * 在指定目录执行 shell 命令并返回输出
 * @param {string} cwd - 命令执行的工作目录
 * @param {string} cmd - 要执行的命令
 * @returns {Promise<string>} 命令输出（去除首尾空白）
 */
function execCmd(cwd, cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd }, (err, out) => err ? reject(err) : resolve(out.trim()))
  })
}

/**
 * 根据远程 URL 分类仓库平台并保存
 * @param {string} url - 仓库远程地址
 * @param {string} branch - 当前分支名称
 * @param {{ github: string[], gitee: string[], gitcode: string[] }} result - 收集结果对象
 */
function classify(url, branch, result) {
  const hosts = [
    { key: "github", pattern: /github\.com[:/](?<repo>[^/]+\/[^/.]+)(?:\.git)?/i },
    { key: "gitee", pattern: /gitee\.com[:/](?<repo>[^/]+\/[^/.]+)(?:\.git)?/i },
    { key: "gitcode", pattern: /gitcode\.com[:/](?<repo>[^/]+\/[^/.]+)(?:\.git)?/i }
  ]

  for (const { key, pattern } of hosts) {
    const m = url.match(pattern)
    if (m?.groups?.repo) {
      result[key].push(`${m.groups.repo}:${branch}`)
      break
    }
  }
}
