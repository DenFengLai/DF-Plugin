import fs from "node:fs"
import { imagePoke } from "#model"
import { Config, Poke_List, Poke_Path } from "#components"
import { logger } from "#lib"

if (!fs.existsSync(Poke_Path) && Config.other.chuo) logger.mark(" 检测到未安装戳一戳图库 将调用XY-Api返回图片")

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
    const { chuo, chuoType } = Config.other
    if (!chuo) return false
    if (this.e.target_id !== this.e.self_id) return false
    let name = chuoType
    if (chuoType !== "all") {
      name = Poke_List[chuoType]
    }
    if (!name) return false
    logger.info(`${logger.blue("[DF-Plugin]")}${logger.green("[戳一戳]")}获取 ${name} 图片`)
    const file = imagePoke(name)
    if (!file) return false
    return this.e.reply(segment.image(file))
  }
}
