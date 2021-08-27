import { Request, Response, NextFunction } from 'express';
import { IcalGenerator } from '../service';

export class GsheetIcsHandler {
    async handle(
        req: Request, 
        res: Response, 
        next: NextFunction
    ): Promise<void> {
        res
            .status(200)
            .contentType('text/calendar')
            .header('Content-Disposition', 'attachment;filename=stx-calendar.ics')
            .send(await new IcalGenerator().generate());
        next();
    }
}