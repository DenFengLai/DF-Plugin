import { CodeUpdate as Cup } from "#model"
import { Config } from "#components"
import { Loading } from "../model/GitRepo/index.js"
import common from "../../../lib/common/common.js"

export class CodeUpdate extends plugin {
  constructor() {
    super({
      name: "DF:仓库更新推送",
      dsc: "检查指定Git仓库是否更新并推送",
      event: "message",
      priority: 5000,
      rule: [
        {
          reg: "^#(检查|推送)仓库更新$",
          fnc: "cupdate"
        },
        {
          reg: /^#DF清理无效数据$/i,
          fnc: "clear",
          permission: "master"
        }
      ]
    })

    if (Config.CodeUpdate.Auto) {
      this.task = {
        cron: Config.CodeUpdate.Cron,
        name: "[DF-Plugin]Git仓库更新检查",
        fnc: () => Cup.checkUpdates(true)
      }
    }
  }

  async cupdate(e) {
    const isPush = e.msg.includes("推送")
    e.reply(`正在${isPush ? "推送" : "检查"}仓库更新，请稍等`)

    const res = await Cup.checkUpdates(!isPush, e)
    if (!isPush) {
      const msg = res?.number > 0
        ? `检查完成，共有${res.number}个仓库有更新，正在按照你的配置进行推送哦~`
        : "检查完成，没有发现仓库有更新"
      return e.reply(msg)
    }
  }

  async clear(e) {
    if (Loading) return e.reply("❎ 请等待本地仓库载入完成哦~")
    const ConfigKeys = Cup.getAllRedisKeys(true)
    const RedisKeys = await redis.keys(`${Cup.redisKey}:*`)
    const invalidKeys = RedisKeys.filter(i => !ConfigKeys.includes(i))
    const { length } = invalidKeys
    if (length > 0) {
      e.reply(`⚠️ 本次需清理${length}个key, 如需清理请发送 #确认清理`)
      this.e.redisInvalidKeys = invalidKeys
      e.reply(common.makeForwardMsg(e, [ "无效键名列表", ...invalidKeys ]))
      this.setContext("startClear")
    } else {
      return e.reply("✅ 你的设备很干净，无需清理")
    }
  }

  async startClear(_e) {
    const e = this.e
    if (/^#?确认清理$/i.test(e.msg)) {
      const num = await redis.del(_e.redisInvalidKeys)
      e.reply(`✅ 成功清理${num}个无效数据`)
    } else {
      e.reply("❎ 已取消")
    }
    this.finish("startClear")
  }
}
