import { GSheetReader } from '../repository';
import { ICalCalendar } from 'ical-generator';

export class IcalGenerator {
    async generate(): Promise<String> {
        let cal = new ICalCalendar();
        cal.name('St. Xavier Cross Country Carpool 2021');
        cal.description('St. Xavier Cross Country Carpool 2021 - Riders and Drivers')
        cal.timezone('America/New_York');
        
        const events = await new GSheetReader().readEventsFromSheet();
        events.forEach(event => cal.createEvent(event));

        return cal.toString();
    }
}