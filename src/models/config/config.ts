import { Global } from "./global";
import { Sheet } from "./sheet";
import { Config } from 'config';

export class Configuration {
    global: Global;
    sheets: Array<Sheet>;

    constructor(configuration: Config) {
        this.global = new Global(configuration.get('global'));
        this.sheets = configuration.get('sheets').map(sheetConfig => new Sheet(sheetConfig));
    }

    public calendarYears(): Map<number, Array<object>> {
        let yearMap = new Map<number, Array<object>>();
        this.sheets.forEach(sheet => {
            let year = Number.parseInt(sheet.path.split('/')[1]);
            let base = sheet.path.split('/')[2];
            if (!yearMap.get(year)) {
                yearMap.set(year, new Array<object>());
            }
            yearMap.get(year).push({
                'path': base,
                'name': sheet.calendarName,
                'description': sheet.calendarDescription,
                'sheet': `https://docs.google.com/spreadsheets/d/${sheet.sheetId}/edit`
            });
        });

        return yearMap;
    }
}