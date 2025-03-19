import { CodeUpdate as Cup } from "#model"
import { Config } from "#components"

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
}
