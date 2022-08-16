import moment from 'moment';

describe('moment', () => {
    it('Should parse ddd, MM/DD/YYYY', () => {
        const fixture = moment('Mon, 8/16/2021');
        expect(fixture.month()).toEqual(7);
        expect(fixture.date()).toEqual(16);
        expect(fixture.year()).toEqual(2021);
        expect(fixture.hour()).toEqual(0);
        expect(fixture.minute()).toEqual(0);
        expect(fixture.second()).toEqual(0);
    });

    it('Should parse ddd, MM/DD/YYYY, hh:mm for a time after noon', () => {
        const fixture = moment('Mon, 8/16/2021 17:30', ['ddd, MM/DD/YYYY, hh:mmA']);
        expect(fixture.month()).toEqual(7);
        expect(fixture.date()).toEqual(16);
        expect(fixture.year()).toEqual(2021);
        expect(fixture.hour()).toEqual(17);
        expect(fixture.minute()).toEqual(30);
        expect(fixture.second()).toEqual(0);
    });

    it('Should parse ddd, MM/DD/YYYY, hh:mm for a time before noon', () => {
        const fixture = moment('Mon, 8/16/2021, 9:30', ['ddd, MM/DD/YYYY, hh:mmA']);
        expect(fixture.month()).toEqual(7);
        expect(fixture.date()).toEqual(16);
        expect(fixture.year()).toEqual(2021);
        expect(fixture.hour()).toEqual(9);
        expect(fixture.minute()).toEqual(30);
        expect(fixture.second()).toEqual(0);
    });

    it('Should parse ddd, MM/DD/YYYY, hh:mm am/pm for a time after noon', () => {
        const fixture = moment('Mon, 8/16/2021, 5:30 pm');
        expect(fixture.month()).toEqual(7);
        expect(fixture.date()).toEqual(16);
        expect(fixture.year()).toEqual(2021);
        expect(fixture.hour()).toEqual(17);
        expect(fixture.minute()).toEqual(30);
        expect(fixture.second()).toEqual(0);
    });

    it('Should parse ddd, MM/DD/YYYY, hh:mm am/pm for a time before noon', () => {
        const fixture = moment('Mon, 8/16/2021, 9:30 am', ['ddd, MM/DD/YYYY, hh:mmA']);
        expect(fixture.month()).toEqual(7);
        expect(fixture.date()).toEqual(16);
        expect(fixture.year()).toEqual(2021);
        expect(fixture.hour()).toEqual(9);
        expect(fixture.minute()).toEqual(30);
        expect(fixture.second()).toEqual(0);
    });    
});