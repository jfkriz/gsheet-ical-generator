export class Global {
    logLevel: string;
    gsheetsCredentials: string;

    constructor(config: any) {
        Object.assign(this, config);
    }
}
