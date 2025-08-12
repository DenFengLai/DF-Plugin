import { Poke_Path } from "./Path.js"
import fs from "node:fs"
import Data from "../components/Data.js"

let Poke_List = Array.from(Data.getJSON("FaceList.json", "json"))

/**
 * 兼容用户自建目录
 * 用户可以在resources/poke下自建多个目录用于存放图片
 */
const loadDirectories = async() => {
  if (fs.existsSync(Poke_Path)) {
    try {
      const directories = await fs.promises.readdir(Poke_Path, { withFileTypes: true })
      const dirNames = directories.filter(dirent => dirent.isDirectory() && dirent.name !== ".git")
        .map(dirent => dirent.name)
      Poke_List = Array.from(new Set([ ...Poke_List, ...dirNames ]))
    } catch (error) { }
  }
}

loadDirectories()

export { Poke_List }
