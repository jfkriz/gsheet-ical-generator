require('dotenv').config();
const config = require('config');

import express from 'express';

import { logger, expressLogger, expressErrorLogger } from './util'
import { GsheetIcsHandler } from './handlers'
import { Configuration } from './models/config';

const port = process.env.PORT || 3000;

const app = express();
app.use(expressLogger);
app.use(expressErrorLogger);

process.on('SIGINT', closeItUp);

const appConfig = new Configuration(config);

appConfig.sheets.forEach(sheet => {
  logger.info(`Registering handler for ${sheet.path}`);
  app.get(sheet.path, (req, res, next) => new GsheetIcsHandler(appConfig.global, sheet).handle(req, res, next));
});

// set the view engine to ejs
app.set('view engine', 'ejs');

// index page
app.get('/', function(req, res) {
  res.render('pages/calendar-list', {
    calendarYears: appConfig.calendarYears()
  });
});

const favicon = require('serve-favicon');
const path = require('path');
try {
  app.use(favicon(path.join(__dirname, 'views', 'favicon.ico')))
} catch(e) {
  // nothing - this fails locally, and I don't feel like fixing it...
}

var server = app.listen(port, () => logger.info(`Server running on port ${port}`));

function closeItUp() {
    logger.info('SIGINT signal received');
    logger.info('Closing http server.');
    server.close(() => {
      logger.info('Http server closed.');
    });
    process.exit(0);
}