import { GSheetReader } from '../repository';
import { ICalCalendar, ICalCalendarMethod } from 'ical-generator';
import {getVtimezoneComponent} from '@touch4it/ical-timezones';
import { Global, Sheet } from '../models/config';

export class IcalGenerator {
    globalConfig: Global;
    sheetConfig: Sheet;

    constructor(globalConfig: Global, sheetConfig: Sheet) {
        this.globalConfig = globalConfig;
        this.sheetConfig = sheetConfig;
    }

    async generate(userAgent?: string, driverFilter?: string): Promise<string> {
        let cal = new ICalCalendar();
        cal.name(this.sheetConfig.calendarName);
        cal.description(this.sheetConfig.calendarDescription);
        cal.scale('GREGORIAN');
        cal.method(ICalCalendarMethod.PUBLISH);
        cal.timezone({
            name: 'America/New_York',
            generator: getVtimezoneComponent
        });
        cal.ttl(60 * 60);
        
        const events = await new GSheetReader(this.globalConfig, this.sheetConfig).readEventsFromSheet(userAgent, driverFilter);
        events.forEach(event => cal.createEvent(event));

        return cal.toString();
    }
}