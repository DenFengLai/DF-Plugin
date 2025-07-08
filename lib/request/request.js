import fetch from "node-fetch"
import { HttpsProxyAgent } from "https-proxy-agent"
import { Config } from "#components"
import { logger } from "#lib"

export default new class Request {
  /**
   * 发送GET请求到指定URL
   * @param {string} url - 发送GET请求的URL
   * @param {object} [options] - 可选的请求头和响应类型
   * @param {object} [options.headers] - 请求头
   * @param {string} [options.responseType] - 响应类型，可选值为 json,text或raw ，默认为 'json'
   * @param {boolean} [options.log] - 是否打印请求日志，默认为true
   * @returns {Promise<object|string|false>} 返回响应数据或false(请求失败)
   */
  async get(url, options = { headers: {}, responseType: "json", log: true }) {
    const { headers = {}, responseType = "json", log = true } = options

    const requestOptions = {
      method: "GET",
      headers
    }

    if (Config.proxy.open && Config.proxy.url) {
      requestOptions.agent = new HttpsProxyAgent(Config.proxy.url)
    }

    try {
      if (log) logger.debug(`[DF-Plugin] GET请求URL: ${logger.green(url)}`)
      const response = await fetch(url, requestOptions)
      return responseType === "raw" ? response : (responseType === "json" ? await response.json() : await response.text())
    } catch (error) {
      if (log) logger.error("GET请求失败:", error)
      return false
    }
  }

  /**
   * 发送POST请求到指定URL
   * @param {string} url - 发送POST请求的URL
   * @param {object} body - 请求体
   * @param {object} [options] - 可选参数
   * @param {object} [options.headers] - 请求头
   * @param {string} [options.responseType] - 响应类型，可选值为 'json', 'text' 或 'raw' ，默认为 'json'
   * @param {boolean} [options.log] - 是否打印请求日志，默认为true
   * @returns {Promise<object|string|false>} 返回响应数据或false(请求失败)
   */
  async post(url, body, options = { headers: {}, responseType: "json", log: true }) {
    const { headers = {}, responseType = "json", log = true } = options

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify(body)
    }

    if (Config.proxy.open && Config.proxy.url) {
      requestOptions.agent = new HttpsProxyAgent(Config.proxy.url)
    }

    try {
      if (log) logger.debug(`[DF-Plugin] POST请求URL: ${logger.green(url)}`)
      const response = await fetch(url, requestOptions)
      return responseType === "raw" ? response : (responseType === "json" ? await response.json() : await response.text())
    } catch (error) {
      if (log) logger.error("[DF-Plugin] POST请求失败:", error)
      return false
    }
  }
}()
