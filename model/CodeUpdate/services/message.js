import { common } from "#components"
export async function sendMessageToUser(data, content, Group, QQ, isAuto, e) {
  if (!isAuto) return e.reply(data)
  for (const group of Group) {
    if (content.length > 0 && data) {
      Bot.pickGroup(group).sendMsg(data)
    }
    await common.sleep(5000)
  }
  for (const qq of QQ) {
    if (content.length > 0 && data) {
      Bot.pickFriend(qq).sendMsg(data)
    }
    await common.sleep(5000)
  }
}
