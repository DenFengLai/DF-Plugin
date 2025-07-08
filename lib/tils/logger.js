let logger = {}

let levels = [ "trace", "debug", "info", "warn", "error", "fatal", "mark" ]

if (Bot.makeLog) {
  for (let level of levels) {
    logger[level] = function(...args) {
      if (Bot.makeLog) {
        Bot.makeLog(level, args, "DF")
      }
    }
  }
  Object.setPrototypeOf(logger, global.logger || {})
} else if (global.logger) {
  logger = global.logger
} else {
  throw new Error("Logger is not defined. Please ensure that Bot.makeLog is set or global.logger is available.")
}

export { logger }

export default logger
