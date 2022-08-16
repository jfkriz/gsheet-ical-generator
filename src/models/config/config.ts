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
}