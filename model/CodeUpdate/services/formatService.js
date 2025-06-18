import { marked } from "marked"
import { timeAgo } from "../utils/timeUtil.js"

export function formatCommitInfo(data, source, repo, branch) {
  const { author, committer, commit, stats, files } = data
  const authorName = `<span>${commit.author.name}</span>`
  const committerName = `<span>${commit.committer.name}</span>`
  const authorTime = `<span>${timeAgo(commit.author.date)}</span>`
  const committerTime = `<span>${timeAgo(commit.committer.date)}</span>`
  const timeInfo = authorName === committerName
    ? `${authorName} 提交于 ${authorTime}`
    : `${authorName} 编写于 ${authorTime}，并由 ${committerName} 提交于 ${committerTime}`

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
    text: formatMessage(commit.message),
    stats: stats && files ? { files: files.length, additions: stats.additions, deletions: stats.deletions } : false
  }
}

export function formatMessage(message) {
  const msgMap = message.split("\n")
  msgMap[0] = "<span class='head'>" + msgMap[0] + "</span>"
  return msgMap.join("\n")
}

export function formatReleaseInfo(data, source, repo) {
  const { tag_name, name, body, author, published_at } = data
  const authorName = `<span>${author?.login || author?.name}</span>`
  const authorAvatar = author?.avatar_url
  const authorTime = `<span>${timeAgo(published_at)}</span>`
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
