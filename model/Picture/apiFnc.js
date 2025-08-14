import { request } from "#components"

export const apiHandlers = [
  {
    reg: "jk(?:制服)?",
    fnc: () => segment.image("https://api.suyanw.cn/api/jk.php")
  },
  {
    reg: "黑丝",
    fnc: () => [
      "唉嗨害，黑丝来咯",
      segment.image("https://api.suyanw.cn/api/hs.php")
    ]
  },
  {
    reg: "白丝",
    fnc: async() => {
      const link = (await request.get("https://v2.api-m.com/api/baisi", { responseType: "json" }))
        .data
        .replace(/\\/g, "/")
      return [
        "白丝来咯~",
        segment.image(link)
      ]
    }
  },
  {
    reg: "cos",
    fnc: async() => {
      const link = (await request.get("https://api.suyanw.cn/api/cos.php?type=json"))
        .text
        .replace(/\\/g, "/")
      return [
        "cos来咯~",
        segment.image(link)
      ]
    }
  },
  {
    reg: "腿子?",
    fnc: async() => {
      const link = (await request.get("https://api.suyanw.cn/api/meitui.php", { responseType: "text" }))
        .match(/https?:\/\/[^ ]+/)?.[0]
      return [
        "看吧涩批！",
        segment.image(link)
      ]
    }
  }
]
