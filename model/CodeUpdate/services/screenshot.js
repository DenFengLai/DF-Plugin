import { common } from "#components"

export async function generateScreenshot(content, saveId) {
  return await common.render("CodeUpdate/index", {
    saveId,
    lifeData: content
  }, { send: false })
}
