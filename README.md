# Going to the Population Association of America's 2018 meeting?

The [posted preliminary program](https://paa.confex.com/paa/2018/webprogrampreliminary/start.html) is kinda a hassle to sort through. For those who enjoy giant spreadsheets - in which each row represents a paper - here's a script to help you out. (You'll need [Node.js](https://nodejs.org/en/), (version 8.x or above) installed and ready on your computer machine.)

```bash
cd ~/somewhere
# get the code on your machine
git pull
# get yourself into that code
cd paa-2018-conf-explorer
# put all the code dependencies on your machine
npm install
# fire it up
npm start # or `node server.js`
```

Wait hopefully for a CSV file to appear before you. It should have a header populated with the following fields:
- `sessionTitle`,
- `sessionHref`,
- `author`,
- `itemNumber`,
- `sessionDatetime`,
- `sessionLocation`,
- `sessionAbstract`,
- `personGroups`,
- `paperTime`,
- `paperNumber`,
- `paperTitle`,
- `paperHref`,
- `paperAuthors`,
- `paperAbstract`, and
- `misc`.

