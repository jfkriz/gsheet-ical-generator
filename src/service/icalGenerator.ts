import { GSheetReader } from '../repository';
import { ICalCalendar, ICalCalendarMethod } from 'ical-generator';
import {getVtimezoneComponent} from '@touch4it/ical-timezones';

export class IcalGenerator {
    async generate(userAgent?: string, driverFilter?: string): Promise<string> {
        let cal = new ICalCalendar();
        cal.name('St. Xavier Cross Country Carpool 2022-2023');
        cal.description('St. Xavier Cross Country Carpool 2022-2023 - Riders and Drivers');
        cal.scale('GREGORIAN');
        cal.method(ICalCalendarMethod.PUBLISH);
        cal.timezone({
            name: 'America/New_York',
            generator: getVtimezoneComponent
        });
        cal.ttl(60 * 60);
        
        const events = await new GSheetReader().readEventsFromSheet(userAgent, driverFilter);
        events.forEach(event => cal.createEvent(event));

        return cal.toString();
    }
}