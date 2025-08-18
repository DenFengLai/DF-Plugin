import { Config } from "#components"

/**
 * 获取配置的Token列表
 * @returns {Record<string, string>}
 */
export const getTokens = () => Object.fromEntries(Config.CodeUpdate.repos.map(({ provider, token }) => [ provider, token ]))

/**
 * 获取平台token
 * @param {string} provider 仓库提供商
 * @returns {string}
 */
export const getToken = (provider) => getTokens()[provider] || ""
