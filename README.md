# gsheet-ical-generator
Generate an iCal feed from a Google Sheet. This could be more of a general-purpose tool, if
it was written to be more configurable, but at the moment, it only operates with one
Google Sheet, generating one iCal feed from that sheet. This project has a github action that 
builds and publishes a Docker container, so you will just need a place to run this container. 
Alternately, it could be deployed as an AWS Lambda, Azure Function, Google Cloud Function, etc, 
but deployment of this is left as an exercise for the reader.

## Pre-requisites
1. A Google Sheet containing a range of data with at least the following columns:
    - Event Date, in a format like Mon, 8/16/2021, 5:00pm
    - Rider 1 - N, contains a `1` if the boy needs a ride for that event, `0` or `x` if no ride needed
    - Total number of riders, typically calculated by totalling the `1`s in the Riders columns
    - Driver Name(s), contains the name of one or more drivers for the day; currently does not specify for pick up or drop-off
    - Notes, optional notes for the event - specify "No Practice" to indicate that this date has no event
2. A Google Cloud Project
3. A Service Account in the Cloud Project, with a JSON key
    - https://developers.google.com/identity/protocols/oauth2/service-account#creatinganaccount
4. Service account should have read access to the Google Sheet
    - Here is a helpful link with step-by-step instructions for #2 - 4: https://stackoverflow.com/a/51037780

## Configuration
Configuration of this application is mainly just setting a list of environment variables that will be available
to NodeJS at runtime. This can be done with a .env file (using example.env as a starting point), or by setting
environment variables for the runtime container, or a mix of the two.

The environment variables needed are as follows:

|Variable|Value|Notes|
|--------|-----|-----|
|`GSHEETS_CREDENTIALS`|The contents of the JSON key from step #3|Do NOT check this in to any shared/public source repository!|
|`GSHEETS_SHEET_ID`|The ID of the Google Sheet|Can be found by viewing the sheet, and looking for the value between `/d/` and `/edit` in the URL - for instance, https://docs.google.com/spreadsheets/d/abc123/edit, the ID would be abc123|
|`GSHEETS_DATA_RANGE`|The range of cells where the events are listed, with columns as mentioned above, specified in typical range format (for example, `Carpool!A18:I200`, to choose cells `A18` through `I200` on the `Carpool` sheet)|The first line in the range should be column headers, with the individual rider names listed, one per column.|
|`DATE_COLUMN`|The column number (0-based) in the range where the event date is found||
|`TIME_COLUMN`|The column number (0-based) in the range where the event time is found||
|`NUM_RIDERS_COLUMN`|The column number (0-based) in the range, where the total number of riders for the day is found.||
|`FIRST_RIDER_COLUMN`|The column number (0-based) in the range, where the first rider is found.||
|`RIDER_COUNT`|The total number of possible riders.|Note that this is not the number of riders for a given event. This is used to determine how many columns to use when looking for riders - so this implies that the rider columns must be next to each other, with no other data in between.|
|`DRIVER_COLUMN`|The column number (0-based) in the range, where the driver's name is found||
|`NOTES_COLUMN`|The column number (0-based) in the range, where the notes for the event are found.|
|`WEEKDAY_PICKUP_TIME`|The default pickup time for weekday events.|This is only used if the value in the `DATE_COLUMN` does not specify a time.|
|`WEEKDAY_PICKUP_LOCATION`|The default address of the pickup location for weekdays.|This assumes all weekday events pickup from the same location. This could be enhanced to add an address column to the data, and then use the default only when that is not populated.|
|`WEEKEND_PICKUP_TIME`|The default pickup time for weekend events.|This is only used if the value in the `DATE_COLUMN` does not specify a time.|
|`WEEKEND_PICKUP_LOCATION`|The default address of the pickup location for weekends.|This assumes all weekend events pickup from the same location. This could be enhanced to add an address column to the data, and then use the default only when that is not populated.|

## Running Locally
Once configured, you can run this application locally with `npm install`, followed by `npm run start`, and then you can access the 
feed by hitting http://localhost:3000. You can alter the port that this listens on by specifying the `PORT` environment variable.

## Usage
The end-user usage is very simple. You will be able to subscribe to the calendar with any tool that supports iCal feeds.
The URL to the calendar will depend on how you deploy and expose this application. Also, the user can optionally filter the feed 
to just receive events they are assigned as a driver on. This can be done by adding `?driver=drivername` to the end of the 
feed URL. This will do a case-insensitive match on the Driver column in the data range, and will match on substrings as well.
So assuming a driver "Joe Smith" and another "Jane Smith", you can specify `?driver=smith` to have events for both Joe and Jane
synced to your calendar, or `?driver=jane%20smith` to see events only for Jane.

This NodeJS app listens on http://localhost:3000/,
but it might be a good idea to have this app fronted by some other server/proxy with a more specific URL, or simply change the
`app.get` line that registers the handler, to listen on a different endpoint.
By default, it is:
```javascript
app.get('/', (req, res, next) => new GsheetIcsHandler().handle(req, res, next));
```

You could change this to the following, to listen on `/calendar/subscription.ics` instead:
```javascript
app.get('/calendar/subscription.ics', (req, res, next) => new GsheetIcsHandler().handle(req, res, next));
``` 

Some popular ones are:
- [Google](https://support.google.com/calendar/answer/37100?hl=en&co=GENIE.Platform%3DDesktop) - instructions under "Use a link to add a public calendar"
- [iOS](https://support.apple.com/guide/iphone/use-multiple-calendars-iph3d1110d4/ios#:~:text=Go%20to%20Settings%20%3E%20Calendar%20%3E%20Accounts%20%3E%20Add%20Account%20%3E%20Other,any%20other%20required%20server%20information.) - instructions under "Subscribe to a Calendar"
- [Cozi](https://www.cozi.com/how-to-add-an-ical-feed-to-cozi/)


