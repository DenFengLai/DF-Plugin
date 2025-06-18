import { Res_Path } from "#components"
import puppeteer from "../../../../../lib/puppeteer/puppeteer.js"

export async function generateScreenshot(content, saveId) {
  return await puppeteer.screenshot("CodeUpdate/index", {
    tplFile: `${Res_Path}/CodeUpdate/index.html`,
    saveId,
    lifeData: content,
    pluResPath: `${Res_Path}/`
  })
}
