import fs from "node:fs"
import Path from "node:path"
import puppeteer from "../../../../lib/puppeteer/puppeteer.js"
import { Data, Version, Plugin_Name, Res_Path, Path as _path, Config } from "#components"

/**
 * 渲染HTML
 * @param {string} path 文件路径
 * @param {object} params 参数
 * @param {object} cfg 配置
 * @param {object} cfg.e 消息事件
 * @param {number} cfg.scale 渲染精度
 * @param {boolean} cfg.send 是否直接发送
 * @param {boolean} cfg.retMsgId 是否返回消息id
 */
export default async function(path, params, cfg = {}) {
  const [ app, tpl ] = path.split("/")
  const resPath = `../../../../../plugins/${Plugin_Name}/resources`
  Data.createDir(`data/html/${Plugin_Name}/${app}/${tpl}`, "root")
  const data = {
    ...params,
    _plugin: Plugin_Name,
    saveId: params.saveId || params.save_id || tpl,
    tplFile: Path.resolve(Res_Path, app, tpl + ".html"),
    pluResPath: resPath,
    _res_path: resPath,
    pageGotoParams: {
      waitUntil: "networkidle0"
    },
    sys: {
      scale: scale(cfg.scale || 1),
      copyright: `Created By ${Version.name}<span class="version">${Version.yunzai}</span> & ${Plugin_Name}<span class="version">${Version.ver}</span>`
    },
    quality: 100
  }
  if (process.argv.includes("web-debug")) {
    // debug下保存当前页面的渲染数据，方便模板编写与调试
    // 由于只用于调试，开发者只关注自己当时开发的文件即可，暂不考虑app及plugin的命名冲突
    const saveDir = _path + "/data/ViewData/"
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir)
    }
    const file = saveDir + tpl + ".json"
    data._app = app
    fs.writeFileSync(file, JSON.stringify(data))
  }
  const base64 = await puppeteer.screenshot(`${Plugin_Name}/${app}/${tpl}`, data)
  let ret = true

  if (cfg.send && base64) {
    const { e } = cfg
    ret = await e.reply(base64)
    return cfg.retMsgId ? ret : true
  }
  return base64
}

/**
 * 根据配置取得渲染精度
 * @param {number} pct 渲染精度初始值
 * @returns {string}
 */
function scale(pct = 1) {
  let scale = Config.other.renderScale
  scale = Math.min(2, Math.max(0.5, scale / 100))
  pct = pct * scale
  return `style='transform:scale(${pct})'`
}
