import { Request, Response, NextFunction } from 'express';
import { logger } from '../util';
import { IcalGenerator } from '../service';

export class GsheetIcsHandler {
    async handle(
        req: Request, 
        res: Response, 
        next: NextFunction
    ): Promise<void> {
        let driverFilter: string = null;
        logger.debug(`Request query parameters: ${JSON.stringify(req.query)}`);
        if (req.query.driver && req.query.driver.length > 0) {
            logger.debug(`Got driver filter query parameter: ${JSON.stringify(req.query.driver)}`);
            driverFilter = req.query.driver.toString();
        }
        res
            .status(200)
            .contentType('text/calendar')
            .header('Content-Disposition', 'attachment;filename=stx-calendar.ics')
            .send(await new IcalGenerator().generate(driverFilter));
        next();
    }
}