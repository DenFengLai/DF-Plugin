import { Poke_Path } from "./Path.js"
import fs from "node:fs"

let Poke_List = [
  "default",
  "柴郡猫",
  "丛雨",
  "诗歌剧",
  "柚子厨",
  "小南梁",
  "古拉",
  "甘城猫猫",
  "龙图",
  "满穗",
  "猫猫虫",
  "纳西妲",
  "心海",
  "fufu",
  "ATRI",
  "绫地宁宁",
  "永雏塔菲",
  "miku",
  "特蕾西娅",
  "doro",
  "米塔",
  "冬川花璃",
  "neuro",
  "kipfel",
  "mygo",
  "猫猫收藏家"
]

/**
 * 兼容用户自建目录
 * 用户可以在resources/poke下自建多个目录用于存放图片
 */
if (fs.existsSync(Poke_Path)) {
  const directories = fs.readdirSync(Poke_Path, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name !== ".git")
    .map(dirent => dirent.name)
  Poke_List = Array.from(new Set([ ...Poke_List, ...directories ]))
}

export { Poke_List }
