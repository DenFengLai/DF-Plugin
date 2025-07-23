import { Config, request } from "#components"
import _ from "lodash"
import { logger } from "#lib"

let Sum
let lock = false
let raw

export default new class Summary {
  /** 初始化外显 */
  lint() {
    raw = segment.image
    this.getSummary()
    segment.image = (file, name) => ({
      type: "image",
      file,
      name,
      summary: this.getSummary()
    })
  }

  /** 获取外显 */
  getSummary() {
    if (Config.summary.type === 1) return Config.summary.text
    else if (Config.summary.type === 2) {
      const data = Sum
      this.getSummaryApi()
      return data
    } else if (Config.summary.type === 3) return _.sample(Config.summary.list)
  }

  /** 更新一言外显 */
  async getSummaryApi() {
    if (lock) return
    lock = true
    try {
      Sum = await request.get(Config.summary.api, { responseType: "text", log: false }) || Sum
    } catch (err) {
      logger.error(`获取一言接口时发生错误：${err}`)
    } finally {
      lock = false
    }
  }

  /**
   * 开关外显
   * @param value 开关
   */
  async Switch(value) {
    if (value) {
      this.lint()
    } else {
      segment.image = raw
    }
  }
}()
