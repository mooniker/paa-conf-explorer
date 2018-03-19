# Going to the Population Association of America's 2018 meeting?

The [posted preliminary program](https://paa.confex.com/paa/2018/webprogrampreliminary/start.html) is a hassle to sort through. For those who enjoy giant spreadsheets - in which each row represents a paper - here's a script to help you out. (You'll need [Node.js](https://nodejs.org/en/), version 8.x or above, installed and ready on your computer machine.)

```bash
# begin by finding a terminal window to type commands
cd ~/somewhere # or wherever you want to put things
# put the script on your computer machine
git clone https://github.com/mooniker/paa-conf-explorer.git
cd paa-conf-explorer
# put all the script's dependencies on your computer machine
npm install
# run the script with your computer machine
npm start # or `node server.js`
```

Wait hopefully for a CSV file to appear before you. It should have a header row populated with the following fields:
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

