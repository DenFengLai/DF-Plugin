import { imagePoke as RandomFace } from "#model"
import { Config, Poke_List as Face_List, request } from "#components"

export class Random_Pictures extends plugin {
  constructor() {
    super({
      name: "DF:随机图片",
      dsc: "随机返回一张图片",
      event: "message",
      priority: 500,
      rule: [
        {
          reg: "^#?(来张|看看|随机)([jJ][kK]|制服(小姐姐)?|黑丝|[Cc][Oo][Ss]|腿子?)$",
          fnc: "handleRequest"
        },
        {
          reg: `^#?(随机|来张)?(${Face_List.join("|")})$`,
          fnc: "handleRequest"
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

    const msg = e.msg
    let response = []

    if (msg.includes("jk") || msg.includes("制服")) {
      response = [ segment.image("https://api.suyanw.cn/api/jk.php") ]
    } else if (msg.includes("黑丝")) {
      response = [ "唉嗨害，黑丝来咯", segment.image("https://api.suyanw.cn/api/hs.php") ]
    } else if (msg.includes("cos")) {
      const link = (await request.get("https://api.suyanw.cn/api/cos.php?type=json")).text.replace(/\\/g, "/")
      response = [ "cos来咯~", segment.image(link) ]
    } else if (msg.includes("腿")) {
      const link = (await request.get("https://api.suyanw.cn/api/meitui.php", { responseType: "text" })).match(/https?:\/\/[^ ]+/)?.[0]
      response = [ "看吧涩批！", segment.image(link) ]
    } else if (msg.includes("随机") || msg.includes("来张") || Config.Picture.Direct) {
      const name = msg.replace(/#|随机|来张/g, "")
      const file = RandomFace(name)
      if (file) {
        response = [ segment.image(file) ]
      }
    } else {
      return false
    }

    if (response.length > 0) {
      return e.reply(response, true)
    }

    return false
  }
}
