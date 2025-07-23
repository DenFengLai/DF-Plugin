import { imagePoke as RandomFace, apiHandlers } from "#model"
import { Config, Poke_List as Face_List } from "#components"
import _ from "lodash"

const PictureRegx = new RegExp(`^#?(?:来张|看看|随机)(${apiHandlers.map(handler => handler.reg).join("|")})$`, "i")
const FaceRegx = new RegExp(`^#?(?:来张|看看|随机)(${Face_List.join("|")})$`, "i")
export class Random_Pictures extends plugin {
  constructor() {
    super({
      name: "DF:随机图片",
      dsc: "随机返回一张图片",
      event: "message",
      priority: 500,
      rule: [
        {
          reg: PictureRegx,
          fnc: "handleRequest"
        },
        {
          reg: FaceRegx,
          fnc: "FaceRequest"
        },
        {
          reg: "^#?[Dd][Ff](随机)?表情包?列表$",
          fnc: "list"
        }
      ]
    })
  }

  get open() {
    return Config.Picture.open
  }

  async list(e) {
    return e.reply(`表情包列表：\n${Face_List.join("、")}\n\n使用 #随机+表情名称`, true)
  }

  async handleRequest(e) {
    if (!this.open) return false

    const type = PictureRegx.exec(e.msg)?.[1]?.toLowerCase()
    const message = await (apiHandlers.find(handler => new RegExp(handler.reg, "i").test(type))
    ).fnc()

    if (!_.isEmpty(message)) {
      return e.reply(message, true)
    }

    return false
  }

  async FaceRequest(e) {
    if (!this.open) return false

    const type = FaceRegx.exec(e.msg)
    const face = type[1].toLowerCase()

    if (Face_List.includes(face)) {
      return e.reply(segment.image(RandomFace(face)), true)
    }

    return false
  }
}
