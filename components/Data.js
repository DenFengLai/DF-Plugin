import _ from "lodash"
import fs from "node:fs"
import path from "node:path"
import { Path, Plugin_Name, Plugin_Path } from "../constants/Path.js"
import { logger } from "#lib"

/**
 * 获取根目录
 * @param {"root" | "yunzai" | string} root
 * @returns {string} 返回的路径
 */
const getRoot = (root = "") => {
  if (root === "root" || root === "yunzai") {
    root = `${Path}/`
  } else if (!root) {
    root = `${Plugin_Path}/`
  }
  return root
}

let Data = {
  /**
   * 根据指定的path依次检查与创建目录
   * @param {string} _path
   * @param {"root" | "yunzai" | string} root
   * @param includeFile
   */
  createDir(_path = "", root = "", includeFile = false) {
    root = getRoot(root)
    const pathList = _path.split("/").map(name => name.trim())
    let nowPath = root

    for (let i = 0; i < pathList.length; i++) {
      const name = pathList[i]
      if (!name) continue

      const isLast = i === pathList.length - 1
      if (!includeFile && isLast) break

      nowPath = path.join(nowPath, name)

      if (!fs.existsSync(nowPath)) {
        fs.mkdirSync(nowPath)
      }
    }
  },

  /** JSON缓存 */
  JSONCache: {},
  /**
   * 获取JSON文件并缓存
   * @param {string} file 文件相对路径
   * @param {"root" | "yunzai" | string} root
   * @returns {object}
   */
  getJSON(file = "", root = "") {
    root = getRoot(root)
    const filePath = path.resolve(root, file)
    if (this.JSONCache[filePath]) return this.JSONCache[filePath]
    if (fs.existsSync(filePath)) {
      try {
        let data = JSON.parse(fs.readFileSync(filePath, "utf8"))
        this.JSONCache[filePath] = data
        return data
      } catch (e) {
        logger.error("读取JSON文件错误", e)
        return {}
      }
    }
    return {}
  },
  /**
   * 读取json
   * @param {string} file
   * @param {"root" | "yunzai" | string} root
   * @returns {object}
   */
  readJSON(file = "", root = "") {
    root = getRoot(root)
    if (fs.existsSync(`${root}/${file}`)) {
      try {
        return JSON.parse(fs.readFileSync(`${root}/${file}`, "utf8"))
      } catch (e) {
        console.log(e)
        return {}
      }
    }
    return {}
  },

  /**
   * 写JSON
   * @param file
   * @param data
   * @param root
   * @param space
   * @returns {boolean}
   */
  writeJSON(file, data, root = "", space = 2) {
    // 检查并创建目录
    Data.createDir(file, root, true)
    root = getRoot(root)
    // delete data._res
    try {
      const filePath = path.resolve(root, file)
      fs.writeFileSync(filePath, JSON.stringify(data, null, space))
      this.JSONCache[filePath] = data
      return true
    } catch (err) {
      logger.error(err)
      return false
    }
  },

  async getRedisJSON(key) {
    try {
      let txt = await redis.get(key)
      if (txt) {
        return JSON.parse(txt)
      }
    } catch (e) {
      console.log(e)
    }
    return {}
  },

  async setRedisJSON(key, data, EX = 3600 * 24 * 90) {
    await redis.set(key, JSON.stringify(data), { EX })
  },

  async importModule(file, root = "") {
    root = getRoot(root)
    if (!/\.js$/.test(file)) {
      file = file + ".js"
    }
    if (fs.existsSync(`${root}/${file}`)) {
      try {
        let data = await import(`file://${root}/${file}?t=${new Date() * 1}`)
        return data || {}
      } catch (e) {
        console.log(e)
      }
    }
    return {}
  },

  async importDefault(file, root) {
    let ret = await Data.importModule(file, root)
    return ret.default || {}
  },

  async import(name) {
    return await Data.importModule(`components/optional-lib/${name}.js`)
  },

  async importCfg(key) {
    let sysCfg = await Data.importModule(`config/system/${key}_system.js`)
    let diyCfg = await Data.importModule(`config/${key}.js`)
    if (diyCfg.isSys) {
      console.error(`${Plugin_Name}: config/${key}.js无效，已忽略`)
      console.error(`如需配置请复制config/${key}_default.js为config/${key}.js，请勿复制config/system下的系统文件`)
      diyCfg = {}
    }
    return {
      sysCfg,
      diyCfg
    }
  },

  /*
  * 返回一个从 target 中选中的属性的对象
  *
  * keyList : 获取字段列表，逗号分割字符串
  *   key1, key2, toKey1:fromKey1, toKey2:fromObj.key
  *
  * defaultData: 当某个字段为空时会选取defaultData的对应内容
  * toKeyPrefix：返回数据的字段前缀，默认为空。defaultData中的键值无需包含toKeyPrefix
  *
  * */

  getData(target, keyList = "", cfg = {}) {
    target = target || {}
    let defaultData = cfg.defaultData || {}
    let ret = {}
    // 分割逗号
    if (typeof (keyList) === "string") {
      keyList = keyList.split(",")
    }

    _.forEach(keyList, (keyCfg) => {
      // 处理通过:指定 toKey & fromKey
      let _keyCfg = keyCfg.split(":")
      let keyTo = _keyCfg[0].trim()
      let keyFrom = (_keyCfg[1] || _keyCfg[0]).trim()
      let keyRet = keyTo
      if (cfg.lowerFirstKey) {
        keyRet = _.lowerFirst(keyRet)
      }
      if (cfg.keyPrefix) {
        keyRet = cfg.keyPrefix + keyRet
      }
      // 通过Data.getVal获取数据
      ret[keyRet] = Data.getVal(target, keyFrom, defaultData[keyTo], cfg)
    })
    return ret
  },

  getVal(target, keyFrom, defaultValue) {
    return _.get(target, keyFrom, defaultValue)
  },

  // 异步池，聚合请求
  async asyncPool(poolLimit, array, iteratorFn) {
    const ret = [] // 存储所有的异步任务
    const executing = [] // 存储正在执行的异步任务
    for (const item of array) {
      // 调用iteratorFn函数创建异步任务
      const p = Promise.resolve().then(() => iteratorFn(item, array))
      // 保存新的异步任务
      ret.push(p)

      // 当poolLimit值小于或等于总任务个数时，进行并发控制
      if (poolLimit <= array.length) {
        // 当任务完成后，从正在执行的任务数组中移除已完成的任务
        const e = p.then(() => executing.splice(executing.indexOf(e), 1))
        executing.push(e) // 保存正在执行的异步任务
        if (executing.length >= poolLimit) {
          // 等待较快的任务执行完成
          await Promise.race(executing)
        }
      }
    }
    return Promise.all(ret)
  },

  // sleep
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  },

  // 获取默认值
  def() {
    for (let idx in arguments) {
      if (!_.isUndefined(arguments[idx])) {
        return arguments[idx]
      }
    }
  },

  // 循环字符串回调
  eachStr: (arr, fn) => {
    if (_.isString(arr)) {
      arr = arr.replace(/\s*(;|；|、|，)\s*/, ",")
      arr = arr.split(",")
    } else if (_.isNumber(arr)) {
      arr = [ arr.toString() ]
    }
    _.forEach(arr, (str, idx) => {
      if (!_.isUndefined(str)) {
        fn(str.trim ? str.trim() : str, idx)
      }
    })
  },

  regRet(reg, txt, idx) {
    if (reg && txt) {
      let ret = reg.exec(txt)
      if (ret && ret[idx]) {
        return ret[idx]
      }
    }
    return false
  },
  /**
   * 读取文件夹和子文件夹指定后缀文件名
   * @param directory
   * @param extension
   * @param excludeDir
   */
  readDirRecursive(directory, extension, excludeDir) {
    let files = fs.readdirSync(directory)

    let jsFiles = files.filter(file => path.extname(file) === `.${extension}`)

    files.filter(file => fs.statSync(path.join(directory, file)).isDirectory())
      .forEach(subdirectory => {
        if (subdirectory === excludeDir) {
          return
        }

        const subdirectoryPath = path.join(directory, subdirectory)
        jsFiles.push(...Data.readDirRecursive(subdirectoryPath, extension, excludeDir)
          .map(fileName => path.join(subdirectory, fileName)))
      })

    return jsFiles
  }
}

export default Data
