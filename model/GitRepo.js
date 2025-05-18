import fs from "node:fs/promises"
import path from "node:path"
import { exec } from "child_process"
import { Path, Config } from "#components"

/** 初始化常量 */
if (Config.AutoPath) PluginDirs()

/**
 * 插件远程路径，包含 GitHub、Gitee 和 GitCode
 * @type {object}
 */
export const PluginPath = { github: [], gitee: [], gitcode: [] }

/**
 * 获取插件对应远程路径
 * @returns {Promise<object>} 插件路径
 */
export async function getPluginsRepo() {
  return traverseDirectories(Path)
}

/** 遍历插件目录，载入常量 */
async function PluginDirs() {
  console.time("载入本地Git仓库列表")
  const result = await getPluginsRepo()
  console.timeEnd("载入本地Git仓库列表")
  PluginPath.github.push(...result.github)
  PluginPath.gitee.push(...result.gitee)
  PluginPath.gitcode.push(...result.gitcode)
}

/**
 * 递归遍历目录以查找包含 .git 的 Git 仓库
 * @param {string} dir - 当前遍历的目录路径
 * @param {object} result - 数据对象
 * @returns {Promise<object>} result - 获取到的插件路径
 */
async function traverseDirectories(dir, result = { github: [], gitee: [], gitcode: [] }) {
  try {
    if (await isGitRepo(dir)) {
      await getGitUrl(dir, result)
    }

    const items = await fs.readdir(dir)
    const promises = items.map(async(item) => {
      if (item === "data" || item === "node_modules") return

      const directory = path.join(dir, item)
      const stat = await fs.stat(directory)
      if (stat.isDirectory()) {
        if (await isGitRepo(directory)) {
          await getGitUrl(directory, result)
        } else {
          await traverseDirectories(directory, result)
        }
      }
    })
    await Promise.all(promises)
  } catch (err) {
    console.error(`无法读取目录: ${dir}`, err)
  }
  return result
}

/**
 * 获取Git仓库的URL并添加到指定的数组中
 * @param {string} dir 路径
 * @param {object} result - 存储 GitHub 和 Gitee 仓库的对象
 */
async function getGitUrl(dir, result) {
  const branch = await getRemoteBranch(dir)
  const remoteUrl = await getRemoteUrl(dir, branch)
  if (remoteUrl) classifyRepo(remoteUrl, branch, result)
}
/**
 * 检查是否为 Git 仓库
 * @param {string} dir - 检查的目录路径
 * @returns {Promise<boolean>} 是否为 Git 仓库
 */
async function isGitRepo(dir) {
  const gitDir = path.join(dir, ".git")
  try {
    await fs.access(gitDir)
    return true
  } catch {
    return false
  }
}

/**
 * 获取仓库分支远程 URL
 * @param {string} repoPath - 仓库路径
 * @param {string} branch - 分支名称
 * @returns {Promise<string>} 仓库的远程 URL
 */
async function getRemoteUrl(repoPath, branch) {
  return executeCommand(`git remote get-url ${await getRemoteName(repoPath, branch)}`, repoPath)
}

/**
 * 获取仓库分支远程名称
 * @param {string} repoPath - 仓库路径
 * @param {string} branch - 分支名称
 * @returns {Promise<string>} 当前分支名称
 */
async function getRemoteName(repoPath, branch) {
  return executeCommand(`git config branch.${branch}.remote`, repoPath)
}

/**
 * 获取仓库当前分支
 * @param {string} repoPath - 仓库路径
 * @returns {Promise<string>} 当前分支名称
 */
async function getRemoteBranch(repoPath) {
  return executeCommand("git branch --show-current", repoPath)
}

/**
 * 根据远程 URL 对仓库进行分类，并将其添加到结果对象中
 * @param {string} url - 仓库的远程 URL
 * @param {string} branch - 当前分支名称
 * @param {object} result - 存储 GitHub 和 Gitee 仓库的对象
 */
function classifyRepo(url, branch, result) {
  if (url.includes("github.com")) {
    const parts = url.split("github.com/")
    if (parts[1]) {
      const repoPath = parts[1].replace(/(\/|\.git)$/, "") + `:${branch}`
      result.github.push(repoPath)
    }
  } else if (url.includes("gitee.com")) {
    const parts = url.split("gitee.com/")
    if (parts[1]) {
      const repoPath = parts[1].replace(/(\/|\.git)$/, "") + `:${branch}`
      result.gitee.push(repoPath)
    }
  } else if (url.includes("gitcode.com")) {
    const parts = url.split("gitcode.com/")
    if (parts[1]) {
      const repoPath = parts[1].replace(/(\/|\.git)$/, "") + `:${branch}`
      result.gitcode.push(repoPath)
    }
  }
}

/**
 * 在指定的路径下执行命令
 * @param {string} command - 要执行的命令
 * @param {string} cwd - 要在其下执行命令的当前工作目录
 * @returns {Promise<string>} 命令执行结果的输出
 */
function executeCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      } else {
        resolve(stdout.trim())
      }
    })
  })
}
