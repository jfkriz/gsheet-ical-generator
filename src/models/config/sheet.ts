export class DefaultTimeAndLocation {
    weekdayPickupTime: string;
    weekdayPickupLocation: string;
    weekendPickupTime: string;
    weekendPickupLocation: string;

    constructor(defaults: any) {
        Object.assign(this, defaults);
    }
}

export class Columns {
    date: number;
    time: number;
    firstRider: number;
    numRiders: number;
    driver: number;
    notes: number;
    alternatePickupAddress: number;

    constructor(columns: any) {
        Object.assign(this, columns);
    }
}

export class Sheet {
    path: string;
    filename: string;
    sheetId: string;
    eventSubject: string;
    calendarName: string;
    calendarDescription: string;
    dataRange: string;
    riderCount: number;
    defaults: DefaultTimeAndLocation;
    columns: Columns;

    constructor(sheet: any) {
        Object.assign(this, sheet);
    }
}
