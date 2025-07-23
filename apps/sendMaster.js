import moment from "moment"
import { ulid } from "ulid"
import { common, Config } from "#components"
import { imagePoke } from "#model"
import { sendMasterMsg, extractMessageId, getSourceMessage, getMasterQQ } from "../model/sendMaster/index.js"
import { logger } from "#lib"

const key = "DF:contact"
let Sending = false
segment.reply ??= (id) => ({ type: "reply", id })
let ReplyReg = /^#?回复(\S+)\s?(.*)?$/

export class SendMasterMsgs extends plugin {
  constructor() {
    super({
      name: "DF:联系主人",
      dsc: "给主人发送一条消息",
      event: "message",
      priority: 400,
      rule: [
        {
          reg: "^#联系主人",
          fnc: "contact"
        },
        {
          reg: ReplyReg,
          fnc: "Replys",
          event: "message.private"
        }
      ]
    })
  }

  /**
   * 联系主人
   * @param {object} e - 消息事件
   */
  async contact(e) {
    if (Sending) return e.reply("❎ 已有发送任务正在进行中，请稍候重试")

    let { open, cd, BotId, sendAvatar, banWords, banUser, banGroup, replyQQ } = Config.sendMaster

    if (!e.isMaster) {
      if (!open) return e.reply("❎ 该功能暂未开启，请先让主人开启才能用哦", true)
      if (cd !== 0 && await redis.get(key)) return e.reply("❎ 操作频繁，请稍后再试", true)
      if (banWords.some(item => e.msg.includes(item))) return e.reply("❎ 消息包含违禁词，请检查后重试", true)
      if (banUser.includes(e.user_id)) return e.reply("❎ 对不起，您不可用", true)
      if (e.isGroup && banGroup.includes(e.group_id)) return e.reply("❎ 该群暂不可用该功能", true)
    }

    Sending = true

    try {
      const message = await common.Replace(e, /#联系主人/)
      if (message.length === 0) return e.reply("❎ 消息不能为空")

      const type = e.bot?.version?.id || e?.adapter_id || "QQ"
      const avatar = sendAvatar ? segment.image(e.sender?.getAvatarUrl?.() || e.friend?.getAvatarUrl?.() || imagePoke("all")) : ""
      const user_id = `${e.sender.nickname}(${e.user_id})`
      const group = e.isGroup ? `${e.group.name || "未知群名"}(${e.group_id})` : "私聊"
      const bot = `${e.bot.nickname}(${e.bot.uin})`
      const time = moment().format("YYYY-MM-DD HH:mm:ss")
      const id = ulid().slice(-5)

      const msg = [
        `联系主人消息(${id})\n`,
        (avatar && sendAvatar) ? avatar : "",
        `平台: ${type}\n`,
        `用户: ${user_id}\n`,
        `来自: ${group}\n`,
        `BOT: ${bot}\n`,
        `时间: ${time}\n`,
        "消息内容:\n",
        ...message,
        "\n-------------\n",
        "引用该消息：#回复 <内容>"
      ]

      const info = {
        bot: e.bot.uin || Bot.uin,
        group: e.isGroup ? e.group_id : false,
        id: e.user_id,
        message_id: e.message_id
      }

      const masterQQ = getMasterQQ(Config.sendMaster)
      if (!Bot[BotId]) BotId = e.self_id

      try {
        await sendMasterMsg(msg, BotId)
        let _msg = "✅ 消息已送达"
        if (replyQQ) _msg += `\n主人的QQ：${masterQQ}`
        await e.reply(_msg, true)
        if (cd) redis.set(key, "1", { EX: cd })
        redis.set(`${key}:${id}`, JSON.stringify(info), { EX: 86400 })
      } catch (err) {
        await e.reply(`❎ 消息发送失败，请尝试自行联系：${masterQQ}\n错误信息：${err}`)
        logger.error(err)
      }
    } catch (err) {
      await e.reply("❎ 出错误辣，稍后重试吧")
      logger.error(err)
    } finally {
      Sending = false
    }
  }

  /**
   * 回复消息
   * @param {object} e - 消息事件
   */
  async Replys(e) {
    if (!e.isMaster) return false

    try {
      const source = await getSourceMessage(e)
      let MsgID, isInput = false
      if (source && (/联系主人消息/.test(source.raw_message))) {
        MsgID = extractMessageId(source.raw_message)
      } else {
        const regRet = ReplyReg.exec(e.msg)
        if (!regRet[1]) return logger.warn(" 未找到消息ID")
        else {
          MsgID = regRet[1].trim()
          isInput = true
        }
      }

      const data = await redis.get(`${key}:${MsgID}`)
      if (!data) return isInput ? false : e.reply("❎ 消息已失效或不存在")

      const { bot, group, id, message_id } = JSON.parse(data)
      const message = await common.Replace(e, isInput ? /#?回复(\S+)\s?/ : /#?回复/g)
      message.unshift(`主人${Config.sendMaster.replyQQ ? `(${e.user_id})` : ""}回复：\n`, segment.reply(message_id))

      this.Bot = Bot[bot] ?? Bot

      group ? await this.Bot.pickGroup(group).sendMsg(message) : await this.Bot.pickFriend(id).sendMsg(message)

      return e.reply("✅ 消息已送达")
    } catch (err) {
      e.reply("❎ 发生错误，请查看控制台日志")
      logger.error("回复消息时发生错误：", err)
      return false
    }
  }
}
