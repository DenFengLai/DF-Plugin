import YAML from "yaml"
import cfg from "../../../lib/config/config.js"
import makeConfig from "../../../lib/plugins/config.js"
import fs from "node:fs/promises"
import { Plugin_Name, Plugin_Path } from "../constants/Path.js"
import _ from "lodash"

class Config {
  plugin_name = Plugin_Name
  plugin_path = Plugin_Path
  /** 初始化配置 */
  async initCfg() {
    this.config = YAML.parse(await fs.readFile(`${this.plugin_path}/config/system/config.yaml`, "utf8"))

    /** 导入旧配置文件 */
    const path = `${this.plugin_path}/config/config`
    if (await fs.stat(path).catch(() => false)) {
      for (let file of (await fs.readdir(path)).filter(file => file.endsWith(".yaml"))) {
        const key = file.replace(".yaml", "")
        if (!(key in this.config)) continue
        _.merge(this.config[key], YAML.parse(await fs.readFile(`${path}/${file}`, "utf8")))
      }
      await fs.rename(path, `${path}_old`)
    }

    /** 保留注释 */
    const keep = {}
    for (const i in this.config) {
      keep[i] = {}
      for (const j in this.config[i]) {
        if (j.endsWith("Tips")) {
          keep[i][j] = this.config[i][j]
        }
      }
    }

    const { config, configSave } = await makeConfig(this.plugin_name, this.config, keep, {
      replacer: i => i.replace(/(\n.+?Tips:)/g, "\n$1")
    })
    this.config = config
    this.configSave = configSave

    /** 迁移 v1 配置 */
    let changed = false
    for (const i in this.config) {
      if (i === "CodeUpdate") {
        if (Array.isArray(this.config[i].List)) {
          this.config[i].List.forEach(item => {
            if (typeof item !== "object") return
            const repos = []
            const sources = [
              { key: "GithubList", provider: "GitHub", type: "commit" },
              { key: "GithubReleases", provider: "GitHub", type: "releases" },
              { key: "GiteeList", provider: "Gitee", type: "commit" },
              { key: "GiteeReleases", provider: "Gitee", type: "releases" },
              { key: "GitcodeList", provider: "Gitcode", type: "commit" },
              { key: "Gitcode", provider: "Gitcode", type: "releases" }
            ]
            for (const { key, provider, type } of sources) {
              const list = item[key]
              if (!Array.isArray(list)) continue
              list.forEach(str => {
                if (typeof str !== "string") return
                const [ repo, branch ] = str.split(":")
                const entry = { provider, repo, type }
                if (branch) entry.branch = branch
                repos.push(entry)
              })
              delete item[key]
              changed = true
            }
            if (!Array.isArray(item.repos)) item.repos = []
            item.repos.push(...repos)
          })
        }
      }
    }
    if (changed) this.configSave()

    return this
  }

  /** 主人列表 */
  get masterQQ() {
    return cfg.masterQQ
  }

  /** TRSS的主人列表 */
  get master() {
    return cfg.master
  }

  get AutoPath() {
    return this.config.CodeUpdate.List.some(i => !!i?.AutoPath)
  }

  /** 联系主人 */
  get sendMaster() {
    return this.config.sendMaster
  }

  /** 戳一戳配置 */
  get Poke() {
    return this.config.Poke
  }

  /** 其他配置 */
  get other() {
    return this.config.other
  }

  /** Git推送 */
  get CodeUpdate() {
    return this.config.CodeUpdate
  }

  /** 图片外显 */
  get summary() {
    return this.config.summary
  }

  /** 随机图片配置 */
  get Picture() {
    return this.config.Picture
  }

  /** 代理配置 */
  get proxy() {
    return this.config.proxy
  }

  /**
   * 群配置
   * @param group_id 群号
   * @param bot_id 机器人账号
   */
  getGroup(group_id = "", bot_id = "") {
    return Array.isArray(Bot.uin) ? cfg.getGroup(bot_id, group_id) : cfg.getGroup(group_id)
  }

  /**
   * 修改设置
   * @param {string} name 配置名
   * @param {string} key 修改的key值
   * @param {string | number} value 修改的value值
   */
  modify(name, key, value) {
    if (typeof this.config[name] != "object") { this.config[name] = {} }
    this.config[name][key] = value
    return this.configSave()
  }

  /**
   * 修改配置数组
   * @param {string} name 文件名
   * @param {string | number} key key值
   * @param {string | number} value value
   * @param {'add'|'del'} category 类别 add or del
   */
  modifyarr(name, key, value, category = "add") {
    if (typeof this.config[name] != "object") this.config[name] = {}
    if (!Array.isArray(this.config[name][key])) this.config[name][key] = []
    if (category == "add") {
      if (!this.config[name][key].includes(value)) this.config[name][key].push(value)
    } else {
      this.config[name][key] = this.config[name][key].filter(item => item !== value)
    }
    return this.configSave()
  }
}

export default await new Config().initCfg()
