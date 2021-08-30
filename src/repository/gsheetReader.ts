import { ICalEventData } from 'ical-generator';
import { google, sheets_v4 } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { logger } from '../util';

import moment from 'moment';

export class GSheetReader {
    auth: GoogleAuth;
    authClient: any = null;
    client: sheets_v4.Sheets = null;

    constructor() {
        logger.debug(`Reading credentials from process.env.GSHEETS_CREDENTIALS`);
        const credentials = JSON.parse(process.env.GSHEETS_CREDENTIALS);
        logger.debug(`Read credentials from process.env.GSHEETS_CREDENTIALS`);
        const scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

        this.auth = new GoogleAuth({
            credentials: credentials,
            scopes: scopes
        });
    }

    async readEventsFromSheet(userAgent?: string, driverFilter?: string): Promise<Array<ICalEventData>> {
        if (this.authClient == null) {
            logger.debug('Getting authClient for sheets');
            this.authClient = await this.auth.getClient();
            logger.debug('Got authClient for sheets');

            logger.debug('Getting sheets client');
            this.client = await google.sheets({
                version: 'v4',
                auth: this.authClient
            });
            logger.debug('Got sheets client');
        }

        logger.debug('Reading range from sheet');
        const res = await this.client.spreadsheets.values.get({
            auth: this.authClient,
            spreadsheetId: process.env.GSHEETS_SHEET_ID,
            range: process.env.GSHEETS_DATA_RANGE
        });

        if (res.status != 200) {
            logger.error(`Error reading range from sheet. Error ${res.status}: ${res.statusText}`);
            throw (res.statusText);
        }

        let spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${process.env.GSHEETS_SHEET_ID}/edit`
        const sheet = await this.client.spreadsheets.get({
            auth: this.authClient,
            spreadsheetId: process.env.GSHEETS_SHEET_ID
        });
        if (sheet.status == 200) {
            logger.debug('Setting spreadsheet URL from sheet data');
            spreadsheetUrl = sheet.data.spreadsheetUrl || spreadsheetUrl;
        }
        logger.debug(`Spreadsheet URL: ${sheet.data.spreadsheetUrl}`);

        const rows = res.data.values;
        if (rows.length === 0) {
            logger.warn('No rows read from sheet');
            return new Array<ICalEventData>();
        } else {
            const riderNames = rows[0].slice(Number.parseInt(process.env.FIRST_RIDER_COLUMN), Number.parseInt(process.env.RIDER_COUNT) + 1);
            return rows.slice(1)
                .filter(row => { return row[6] && (!row[8] || !row[8].toLowerCase().replace(' ', '').includes('nopractice')) })
                .map(row => {
                    logger.debug(`${row.join(",")}`);

                    // Get the start date of the event - may or may not have time, moment will handle this
                    let date = moment(row[process.env.DATE_COLUMN], ['ddd, MM/DD/YYYY, hh:mmA']);
                    logger.debug(`Start date: ${date}`);
                    
                    // Determine if the date is a weekend or not
                    const day = date.format('dddd').toLowerCase();
                    const weekend = day == 'saturday' || day == 'sunday';

                    // Set the time if not specified in the sheet data
                    if (date.hour() === 0 && date.minute() === 0 && date.second() === 0) {
                        logger.debug(`No time specified on ${date}, setting defaults`);
                        const time = weekend ? 
                        moment(process.env.WEEKEND_PICKUP_TIME, ['h:m a', 'H:m']) : moment(process.env.WEEKDAY_PICKUP_TIME, ['h:m a', 'H:m']);
                        logger.debug(`Pickup time: ${time}`);
                        date = date.set({hour: time.get('hour'), minute: time.get('minute')});
                        logger.debug(`Start date w/time: ${date}`);
                    }

                    // Set the location on weekdays vs weekend
                    const location = weekend ?
                        process.env.WEEKEND_PICKUP_LOCATION : process.env.WEEKDAY_PICKUP_LOCATION;
                    logger.debug(`Location: ${location}`);

                    const driver = row[process.env.DRIVER_COLUMN] || 'NO DRIVER';
                    const numRiders = row[process.env.NUM_RIDERS_COLUMN];
                    const notes = row[process.env.NOTES_COLUMN] || undefined;
                    const eventId = date.format('YYYYMMDDHHmmss');

                    // Get an array of all the riders
                    const riders = row.slice(
                            Number.parseInt(process.env.FIRST_RIDER_COLUMN), 
                            Number.parseInt(process.env.RIDER_COUNT) + 1
                        ).map((rider, ix) => {
                            if (rider && rider == 1) {
                                return riderNames[ix];
                            } else {
                                return '';
                            }
                        }).filter(rider => { return rider != '';});

                    let description = `Pick up ${numRiders} boys from Cross Country.\n\n`
                        + `Boys at practice today:\n`
                        + riders.join("\n");

                    let altDescription = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2//EN">`
                        + `<HTML><HEAD><TITLE></TITLE></HEAD><BODY>`
                        + `<p>Pick up ${numRiders} boys from Cross Country.</p>`
                        + `<p>Boys at practice today:`
                        + `<ul>`
                        + riders.map(n => { return `<li>${n}</li>`; }).join("")
                        + `</ul>`
                        + `</p>`;

                    if (notes && notes !== null && notes !== undefined) {
                        logger.debug(`Notes: ${notes}`);
                        description = description
                            + `\n\nNote: ${notes}`;
                        altDescription = `${altDescription}`
                            + `<p><b>Note:</b>${notes.replace(/\n/g, "<br>")}</p>`;
                    }

                    description = `${description}\n\nSpreadsheet Source: ${spreadsheetUrl}`;
                    altDescription = `${altDescription}<p><a href="${spreadsheetUrl}" target="_blank" title="${spreadsheetUrl}">Spreadsheet Link</a></p></BODY></HTML>`;

                    return {
                        summary: `${driver}: Cross Country Pickup`,
                        description: userAgent == "Google-Calendar-Importer" ? altDescription : description,
                        start: date,
                        id: eventId,
                        location: location,
                        x: {
                            'X-ALT-DESC;FMTTYPE=text/html': altDescription
                        }
                    } as ICalEventData;
                }).filter(event => {
                    // If we have a driverFilter, only return events for that driver
                    return !driverFilter 
                        || event.summary.split(':', 2)[0].toLowerCase().indexOf(driverFilter.toLowerCase()) >= 0;
                });
        }
    }
}