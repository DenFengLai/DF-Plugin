const levels = [ "trace", "debug", "info", "warn", "error", "fatal", "mark" ]
const old_logger = global.logger
const logger = {}

const isTRSS = typeof Bot?.makeLog === "function"

for (const level of levels) {
  if (isTRSS) {
    logger[level] = (...args) => Bot.makeLog(level, args, "DF")
  // } else if (old_logger?.[level]) {
    // logger[level] = (...args) => {
    //   const tag = old_logger.blue?.("[DF-Plugin]") ?? "[DF-Plugin]"
    //   old_logger[level](tag, ...args)
    // }
  } else {
    logger[level] = old_logger?.[level] || (() => {})
  }
}

if (!isTRSS && !old_logger) {
  throw new Error(
    "Logger is not defined. Please ensure that Bot.makeLog or global.logger is available."
  )
}

if (old_logger) {
  Object.setPrototypeOf(logger, old_logger)
}

export { logger }
export default logger
