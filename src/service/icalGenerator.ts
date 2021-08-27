import { GSheetReader } from '../repository';
import { ICalCalendar, ICalCalendarMethod } from 'ical-generator';
import {getVtimezoneComponent} from '@touch4it/ical-timezones';

export class IcalGenerator {
    async generate(driverFilter?: string): Promise<string> {
        let cal = new ICalCalendar();
        cal.name('St. Xavier Cross Country Carpool 2021');
        cal.description('St. Xavier Cross Country Carpool 2021 - Riders and Drivers');
        cal.scale('GREGORIAN');
        cal.method(ICalCalendarMethod.PUBLISH);
        cal.timezone({
            name: 'America/New_York',
            generator: getVtimezoneComponent
        });
        
        const events = await new GSheetReader().readEventsFromSheet(driverFilter);
        events.forEach(event => cal.createEvent(event));

        return cal.toString();
    }
}