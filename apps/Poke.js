import fs from "node:fs"
import { imagePoke } from "#model"
import { Config, Poke_List, Poke_Path, Data, Res_Path } from "#components"
import { logger } from "#lib"
import _ from "lodash"

if (!fs.existsSync(Poke_Path) && Config.Poke.chuo) logger.mark(" 检测到未安装戳一戳图库 将调用XY-Api返回图片")

export class DF_Poke extends plugin {
  constructor() {
    super({
      name: "DF:戳一戳",
      dsc: "戳一戳机器人发送随机表情包",
      event: "notice.*.poke",
      priority: -114,
      rule: [ { fnc: "poke", log: false } ]
    })
  }

  async poke() {
    let { chuo, mode } = Config.Poke
    if (!chuo) return false
    if (this.e.target_id !== this.e.self_id) return false
    if (mode === "random") mode = _.sample([ "image", "text" ])
    switch (mode) {
      case "image" : {
        const { imageType } = Config.Poke
        let name = imageType
        if (imageType !== "all") {
          name = Poke_List[imageType]
        }
        if (!name) return false
        logger.info(`${logger.blue("[DF-Plugin]")}${logger.green("[戳一戳]")}获取 ${name} 图片`)
        const file = imagePoke(name)
        if (!file) return false
        return this.e.reply(segment.image(file))
      }
      case "text": {
        const { textMode, textList } = Config.Poke
        if (textMode === "hitokoto") {
          const data = Data.getJSON("poke_hitokoto.json", Res_Path)
          if (data && Array.isArray(data) && data.length > 0) {
            const text = _.sample(data)
            return this.e.reply(text)
          }
        } else if (textMode === "list") {
          if (_.isEmpty(textList)) return false
          return this.e.reply(_.sample(textList))
        }
        return false
      }
      case "mix": {
        logger.warn("混合类型暂未支持，敬请期待")
        return false
      }
      default:
        logger.warn("不支持的戳一戳模式: ", mode)
        return false
    }
  }
}
