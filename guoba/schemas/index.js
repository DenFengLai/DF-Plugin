import CodeUpdate from "./CodeUpdate.js"
import Picture from "./Picture.js"
import Poke from "./Poke.js"
import other from "./other.js"
import sendMaster from "./SendMaster.js"
import summary from "./Summary.js"
import proxy from "./proxy.js"
import { Config } from "#components"

export const schemas = [
  sendMaster,
  Poke,
  CodeUpdate,
  Picture,
  summary,
  proxy,
  other
].flat()

export function getConfigData() {
  const configKeys = [ "other", "sendMaster", "CodeUpdate", "summary", "Picture", "proxy" ]
  return configKeys.reduce((acc, key) => {
    acc[key] = Config[key]
    return acc
  }, {})
}

export async function setConfigData(data, { Result }) {
  for (let key in data) {
    Config.modify(...key.split("."), data[key])
  }
  return Result.ok({}, "Ciallo～(∠・ω< )⌒☆")
}
