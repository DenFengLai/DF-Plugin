import { common } from "#components"
import moment from "moment"

/**
 * 转换时间为多久前
 * @param date - 时间参数
 */
export const timeAgo = (date) => common.timeAgo(moment(date))
