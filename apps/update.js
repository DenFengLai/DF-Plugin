import fs from "node:fs"
import { exec } from "node:child_process"
import { update as Update } from "../../other/update.js"
import { Plugin_Name, Plugin_Path, Poke_Path } from "#components"

let lock = false

export class DFupdate extends plugin {
  constructor() {
    super({
      name: "DF:更新插件",
      event: "message",
      priority: 1000,
      rule: [
        {
          reg: /^#DF(插件)?(强制)?更新(日志)?$/i,
          fnc: "update"
        },
        {
          reg: /^#?DF(安装|(强制)?更新)(戳一戳)?图库$/i,
          fnc: "up_img"
        }
      ]
    })
  }

  async update(e = this.e) {
    const isLog = e.msg.includes("日志")
    const Type = isLog ? "#更新日志" : (e.msg.includes("强制") ? "#强制更新" : "#更新")
    e.msg = Type + Plugin_Name
    const up = new Update(e)
    up.e = e
    return isLog ? up.updateLog() : up.update()
  }

  async up_img(e) {
    if (!e.isMaster) return false
    if (lock) return e.reply("已有更新任务正在进行中，请勿重复操作！")

    lock = true
    try {
      if (fs.existsSync(Poke_Path)) {
        const isForce = e.msg.includes("强制")
        await e.reply(`开始${isForce ? "强制" : ""}更新图库啦，请主人稍安勿躁~`)
        await this.executeGitCommand(e, isForce)
      } else {
        await e.reply("开始安装戳一戳图库,可能需要一段时间,请主人稍安勿躁~")
        await this.cloneRepository(e)
      }
    } finally {
      lock = false
    }
    return true
  }

  /**
   * 更新图片资源。
   * @param {object} e - 事件对象。
   * @param {boolean} isForce - 是否使用强制更新。
   * @returns {Promise<void>} 返回一个在 Git 命令执行完成时解析的 Promise。
   */
  executeGitCommand(e, isForce) {
    return new Promise((resolve) => {
      const command = isForce ? "git reset --hard origin/main && git pull --rebase" : "git pull"
      exec(command, { cwd: Poke_Path }, (error, stdout) => {
        if (error) {
          e.reply(`图片资源更新失败！\nError code: ${error.code}\n${error.stack}\n 请尝试使用 #DF强制更新图库 或稍后重试。`)
        } else if (/Already up to date/.test(stdout) || stdout.includes("最新")) {
          e.reply("目前所有图片都已经是最新了~")
        } else {
          const numRet = /(\d*) files changed,/.exec(stdout)
          if (numRet && numRet[1]) {
            e.reply(`更新成功，共更新了${numRet[1]}张图片~`)
          } else {
            e.reply("戳一戳图片资源更新完毕")
          }
        }
        resolve()
      })
    })
  }

  /**
   * 安装戳一戳图库
   * @param {object} e - 事件对象，用于回复消息。
   * @returns {Promise<void>} - 返回一个Promise，当克隆操作完成时解析。
   */
  cloneRepository(e) {
    return new Promise((resolve) => {
      const command = "git clone --depth=1 https://gitea.eustia.fun/XY/poke.git ./resources/poke"
      exec(command, { cwd: Plugin_Path }, (error) => {
        if (error) {
          e.reply(`戳一戳图库安装失败！\nError code: ${error.code}\n${error.stack}\n 请稍后重试。`)
        } else {
          e.reply("戳一戳图库安装成功！您后续也可以通过 #DF更新图库 命令来更新图片")
        }
        resolve()
      })
    })
  }
}
