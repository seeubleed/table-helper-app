const winston = require('winston')

const logger = winston.createLogger({
  level: 'info', // Уровень логирования (info, error, warn, debug)
  format: winston.format.combine(
    winston.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`
    })
  ),
  transports: [
    new winston.transports.Console(), // Вывод в консоль
    new winston.transports.File({ filename: 'app.log' }), // Запись в файл
  ],
})

module.exports = logger
