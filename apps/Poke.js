import fs from "node:fs"
import { imagePoke } from "#model"
import { Config, Poke_List, Poke_Path, Data } from "#components"
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
    if (mode === "random") mode = _.sample([ "image", "text", "mix" ])
    switch (mode) {
      case "image" : {
        logger.info(`${logger.blue("[ DF-Plugin ]")}${logger.green("[戳一戳]")} 图片模式`)
        const img = this.Image()
        return img ? this.e.reply(img) : false
      }
      case "text": {
        logger.info(`${logger.blue("[ DF-Plugin ]")}${logger.green("[戳一戳]")} 文本模式`)
        const text = this.Text()
        return text ? this.e.reply(text) : false
      }
      case "mix": {
        logger.info(`${logger.blue("[ DF-Plugin ]")}${logger.green("[戳一戳]")} 混合模式`)
        const msg = [], img = this.Image(), txt = this.Text()
        if (txt) msg.push(txt)
        if (img) msg.push(img)
        return _.isEmpty(msg) ? false : this.e.reply(msg)
      }
      default:
        logger.warn("不支持的戳一戳模式: ", mode)
        return false
    }
  }

  Image() {
    const { imageType } = Config.Poke
    let name = imageType
    if (imageType !== "all") {
      name = Poke_List[imageType]
    }
    if (!name) return false
    logger.debug(`${logger.blue("[ DF-Plugin ]")}${logger.green("[戳一戳]")} 获取 ${name} 图片`)
    const file = imagePoke(name)
    if (!file) return false
    return segment.image(file)
  }

  Text() {
    const { textMode, textList } = Config.Poke
    if (textMode === "hitokoto") {
      const data = Data.getJSON("PokeText.json", "json")
      if (data && Array.isArray(data) && data.length > 0) {
        const text = _.sample(data)
        logger.debug(`${logger.blue("[ DF-Plugin ]")}${logger.green("[戳一戳]")} 获取一言文字:`, text)
        return text
      }
    } else if (textMode === "list") {
      if (_.isEmpty(textList)) return false
      const text = _.sample(textList)
      logger.debug(`${logger.blue("[ DF-Plugin ]")}${logger.green("[戳一戳]")} 获取自定义文本:`, text)
    }
    return false
  }
}
