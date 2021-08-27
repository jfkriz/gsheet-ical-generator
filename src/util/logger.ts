import appRoot from 'app-root-path';
import { createLogger, transports, format } from 'winston';
import { logger as expressWinstonLogger, errorLogger as expressWinstonErrorLogger } from 'express-winston';

const LOG_FILE_PATH = `${appRoot}/logs/app.log`;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

const level = process.env.APP_LOG_LEVEL || 'info';
const tsFormat = 'YYYY-MM-DD HH:mm:ss.SSS Z';

// define the custom settings for each transport (file, console)
const options = {
    file: {
        level: level,
        filename: LOG_FILE_PATH,
        handleExceptions: true,
        format: format.combine(
            format.timestamp({ format: tsFormat }),
            format.json(),
        ),
        maxsize: MAX_FILE_SIZE,
        maxFiles: MAX_FILES,
    },
    console: {
        level: level,
        handleExceptions: true,
        format: format.combine(
            format.colorize({
                level: true,
                colors: {
                    info: 'green',
                    error: 'bold white redBG',
                    debug: 'bold white yellowBG',
                    warn: 'yellow'
                }
            }),
            format.timestamp({
                format: tsFormat
            }), 
            format.printf((info) => {
                return `${info.timestamp} ${info.level} ${info.message}`;
            }),
        ),
    },
};

// instantiate a new Winston Logger with the settings defined above
export const logger = createLogger({
    transports: [
        new transports.File(options.file),
        new transports.Console(options.console),
    ],
    exitOnError: false, // do not exit on handled exceptions
});

export const expressLogger = expressWinstonLogger({
    winstonInstance: logger
});

export const expressErrorLogger = expressWinstonErrorLogger({
    winstonInstance: logger
});