import { fileURLToPath } from "node:url"
import { join, dirname, basename } from "node:path"

/** Yunzai本体的绝对路径 */
export const Path = process.cwd()
/** 插件路径 */
export const Plugin_Path = join(dirname(fileURLToPath(import.meta.url)), "..").replace(/\\/g, "/")
/** 插件名称 */
export const Plugin_Name = basename(Plugin_Path)
/** 插件资源存放目录 */
export const Res_Path = join(Plugin_Path, "resources")
/** 插件表情包存放目录 */
export const Poke_Path = join(Res_Path, "poke")
