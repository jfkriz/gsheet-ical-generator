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

    async readEventsFromSheet(): Promise<Array<ICalEventData>> {
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

        const rows = res.data.values;
        if (rows.length === 0) {
            logger.warn('No rows read from sheet');
            return new Array<ICalEventData>();
        } else {
            return rows
                .filter(row => { return row[6] && (!row[8] || row[8].toLowerCase().replace(' ', '') != 'nopractice') })
                .map(row => {
                    logger.debug(`${row.join(",")}`);
                    let date = moment(row[process.env.DATE_COLUMN]);
                    logger.debug(`Start date: ${date}`);
                    const day = date.format('dddd').toLowerCase();
                    const weekend = day == 'saturday' || day == 'sunday';
                    const time = weekend ? 
                        moment(process.env.WEEKEND_PICKUP_TIME, ['h:m a', 'H:m']) : moment(process.env.WEEKDAY_PICKUP_TIME, ['h:m a', 'H:m']);
                    logger.debug(`Pickup time: ${time}`);
                    date = date.set({hour: time.get('hour'), minute: time.get('minute')});
                    logger.debug(`Start date w/time: ${date}`);
                    const location = weekend ?
                        process.env.WEEKEND_PICKUP_LOCATION : process.env.WEEKDAY_PICKUP_LOCATION;
                    logger.debug(`Location: ${location}`);
                    const driver = row[process.env.DRIVER_COLUMN] || 'NO DRIVER';
                    const riders = row[process.env.NUM_RIDERS_COLUMN];
                    const notes = row[process.env.NOTES_COLUMN] || null;
                    const eventId = date.format('YYYYMMDDHHmmss');

                    return {
                        summary: `${driver}: Cross Country Pickup`,
                        description: `Pick up ${riders} boys from Cross Country.${notes != null ? "\nNote: " + notes : ""}`,
                        start: date,
                        id: eventId,
                        location: location
                    } as ICalEventData;
                });
        }
    }
}