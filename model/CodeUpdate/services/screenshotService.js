import { Res_Path, Version, Plugin_Name } from "#components"
import puppeteer from "../../../../../lib/puppeteer/puppeteer.js"

export async function generateScreenshot(content, saveId) {
  return await puppeteer.screenshot("CodeUpdate/index", {
    tplFile: `${Res_Path}/CodeUpdate/index.html`,
    saveId,
    lifeData: content,
    pluResPath: Res_Path,
    copyright: `Created By ${Version.name} <span class="version">v${Version.yunzai}</span> & ${Plugin_Name}<span class="version">v${Version.ver}</span>`
  })
}
