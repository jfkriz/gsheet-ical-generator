import { ICalEventData } from 'ical-generator';
import { google, sheets_v4 } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { logger } from '../util';

import moment from 'moment';
import { Global, Sheet } from '../models/config';

export class GSheetReader {
    auth: GoogleAuth;
    authClient: any = null;
    client: sheets_v4.Sheets = null;
    globalConfig: Global;
    sheetConfig: Sheet;

    constructor(globalConfig: Global, sheetConfig: Sheet) {
        this.globalConfig = globalConfig;
        this.sheetConfig = sheetConfig;

        logger.debug(`Reading credentials from process.env.GSHEETS_CREDENTIALS`);
        const credentials = JSON.parse(this.globalConfig.gsheetsCredentials);
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
            spreadsheetId: this.sheetConfig.sheetId,
            range: this.sheetConfig.dataRange
        });

        if (res.status != 200) {
            logger.error(`Error reading range from sheet. Error ${res.status}: ${res.statusText}`);
            throw (res.statusText);
        }

        let spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${this.sheetConfig.sheetId}/edit`
        const sheet = await this.client.spreadsheets.get({
            auth: this.authClient,
            spreadsheetId: this.sheetConfig.sheetId
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
            const riderStartColumn = this.sheetConfig.columns.firstRider;
            const riderEndColumn = riderStartColumn + this.sheetConfig.riderCount;
            const riderNames = rows[0].slice(riderStartColumn, riderEndColumn);
            logger.debug(`Riders: ${riderNames.join(",")}`);
            return rows.slice(1)
                .filter(row => {
                    let numRiders = row[this.sheetConfig.columns.numRiders] ? row[this.sheetConfig.columns.numRiders] : 0;
                    let notes = row[this.sheetConfig.columns.notes] ? row[this.sheetConfig.columns.notes].toLowerCase().replace(' ', '') : '';
                    return numRiders 
                        && numRiders > 0 
                        && (!notes.includes('noschool') || !notes.includes('noclasses') || !notes.includes('weekend') || !notes.includes('break')); 
                })
                .map(row => {
                    logger.debug(`${row.join(",")}`);

                    // Get the start date of the event - may or may not have time, moment will handle this
                    let date = moment(row[this.sheetConfig.columns.date], ['ddd, MM/DD/YYYY, hh:mmA']);
                    logger.debug(`Start date: ${date}`);
                    
                    // Determine if the date is a weekend or not
                    const day = date.format('dddd').toLowerCase();
                    const weekend = day == 'saturday' || day == 'sunday';

                    let time = this.sheetConfig.columns.time && moment(row[this.sheetConfig.columns.time], 'hh:mmA');
                    logger.debug(`Time in sheet: ${time}`);
                    if (!time || !time.isValid() || (time.hour() === 0 && time.minute() === 0 && time.second() === 0)) {
                        logger.debug(`No time specified, setting defaults`);
                        time = weekend ? 
                            moment(this.sheetConfig.defaults.weekendPickupTime, ['h:m a', 'H:m']) : 
                            moment(this.sheetConfig.defaults.weekdayPickupTime, ['h:m a', 'H:m']);
                    }
                    logger.debug(`Pickup time: ${time.format('hh:mm a')}`);
                    // // This is after-school pickup - clean up bad data in the spreadsheet to make the pickup time PM)
                    // if(!weekend && time.get('hour') < 12) {
                    //     time = time.set({hour: time.get('hour') + 12});
                    //     logger.debug(`Added 12 hours to pickup time: ${time}`)
                    // }

                    // Set the time on the date, since they are separate columns now
                    date = date.set({hour: time.get('hour'), minute: time.get('minute')});
                    logger.debug(`Start date w/time: ${date}`);

                    // Set the location on weekdays vs weekend
                    const location = (this.sheetConfig.columns.alternatePickupAddress ? 
                        row[this.sheetConfig.columns.alternatePickupAddress] : null) || weekend ?
                        this.sheetConfig.defaults.weekendPickupLocation : this.sheetConfig.defaults.weekdayPickupLocation;
                    logger.debug(`Location: ${location}`);

                    const driver = row[this.sheetConfig.columns.driver] || 'NO DRIVER';
                    const numRiders = row[this.sheetConfig.columns.numRiders];
                    const notes = row[this.sheetConfig.columns.notes] || undefined;
                    const eventId = date.format('YYYYMMDDHHmmss');

                    // Get an array of all the riders
                    const riders = row.slice(
                            riderStartColumn, 
                            riderEndColumn
                        ).map((rider, ix) => {
                            if (rider && rider == 1) {
                                return riderNames[ix];
                            } else {
                                return '';
                            }
                        }).filter(rider => { return rider != '';});

                    let description = `Pick up ${numRiders} boys from St Xavier.\n\n`
                        + `Boys riding today:\n`
                        + riders.join("\n");

                    let altDescription = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2//EN">`
                        + `<HTML><HEAD><TITLE></TITLE></HEAD><BODY>`
                        + `<p>Pick up ${numRiders} boys from St. Xavier.</p>`
                        + `<p>Boys riding today:`
                        + `<ul>`
                        + riders.map(n => { return `<li>${n}</li>`; }).join("")
                        + `</ul>`
                        + `</p>`;

                    if (notes && notes !== null && notes !== undefined) {
                        logger.debug(`Notes: ${notes}`);
                        description = `${description}\n\nNote: ${notes}`;
                        altDescription = `${altDescription}<p><b>Note:</b> ${notes.replace(/\n/g, "<br>")}</p>`;
                    }

                    description = `${description}\n\nSpreadsheet Source: ${spreadsheetUrl}`;
                    altDescription = `${altDescription}<p><a href="${spreadsheetUrl}" target="_blank" title="${spreadsheetUrl}">Spreadsheet Link</a></p></BODY></HTML>`;

                    return {
                        summary: `${driver}: ${this.sheetConfig.eventSubject}`,
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
