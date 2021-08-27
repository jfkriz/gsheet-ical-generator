require('dotenv').config();

import express from 'express';

import { logger, expressLogger, expressErrorLogger } from './util'
import { GsheetIcsHandler } from './handlers'

const port = process.env.PORT || 3000;

const app = express();
app.use(expressLogger);
app.use(expressErrorLogger);

process.on('SIGINT', closeItUp);

app.get('/', (req, res, next) => new GsheetIcsHandler().handle(req, res, next));
var server = app.listen(port, () => logger.info(`Server running on port ${port}`));

function closeItUp() {
    logger.info('SIGINT signal received');
    logger.info('Closing http server.');
    server.close(() => {
      logger.info('Http server closed.');
    });
}