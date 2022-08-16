import { Configuration } from '../src/models/config';
require('dotenv').config();
const config = require('config');

describe('Configuration', () => {
    it('should parse configuration', () => {
        const fixture = new Configuration(config);
        console.log(`Config: ${JSON.stringify(fixture)}`);
        expect(fixture.global).toBeDefined();
    });
});