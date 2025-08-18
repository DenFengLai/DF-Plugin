import lodash from "lodash"
import { common, Data } from "#components"
import Theme from "../model/help/theme.js"

export class help extends plugin {
  constructor() {
    super({
      name: "DF:帮助",
      dsc: "DF插件命令帮助",
      event: "message",
      priority: 2000,
      rule: [
        {
          reg: "^#?[Dd][Ff](插件)?帮助$",
          fnc: "help"
        }
      ]
    })
  }

  async help(e) {
    let custom = {}
    const help = {}

    const { diyCfg, sysCfg } = await Data.importCfg("help")

    custom = help

    const helpConfig = lodash.defaults(diyCfg.helpCfg || {}, custom.helpCfg, sysCfg.helpCfg)
    const helpList = diyCfg.helpList || custom.helpList || sysCfg.helpList
    const helpGroup = []

    lodash.forEach(helpList, (group) => {
      if (group.auth && group.auth === "master" && !e.isMaster) {
        return true
      }

      lodash.forEach(group.list, (help) => {
        const icon = help.icon * 1
        if (!icon) {
          help.css = "display:none"
        } else {
          const x = (icon - 1) % 10
          const y = (icon - x - 1) / 10
          help.css = `background-position:-${x * 50}px -${y * 50}px`
        }
      })

      helpGroup.push(group)
    })
    const themeData = await Theme.getThemeData(diyCfg.helpCfg || {}, sysCfg.helpCfg || {})

    return await common.render("help/index", {
      helpCfg: helpConfig,
      helpGroup,
      ...themeData
    }, { e, scale: 1.6, send: true })
  }
}
