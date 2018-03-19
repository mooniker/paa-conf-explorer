
const axios = require('axios')
const { JSDOM } = require('jsdom')
const { URL } = require('url')
const json2csv = require('json2csv').parse
const fs = require('fs')

// default params
const paaUrl = 'https://paa.confex.com/paa/2018/webprogrampreliminary/meeting.html'
const today = new Date()
const dateSuffix = `_${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
const outputFile = `session_papers${dateSuffix}.csv`
const errorLogFile = 'error.log'

// columns for CSV output
const headers = [
  'sessionTitle',
  'sessionHref',
  'author',
  'itemNumber',
  'sessionDatetime',
  'sessionLocation',
  'sessionAbstract',
  'personGroups',
  'paperTime',
  'paperNumber',
  'paperTitle',
  'paperHref',
  'paperAuthors',
  'paperAbstract',
  'misc'
]

const paaSessionCompiler = (params = {}) => axios
  // get the PAA's annual meeting session main/index page
  .get(params.url || paaUrl)
  // convert the response into a DOM
  .then(response => {
    const { document } = (new JSDOM(response.data)).window
    return document
  })
  .then(document => {
    let items = [...document.querySelectorAll('.item')]
      // filter by only those that have an integer as an item number
      .filter(div => parseInt(div.querySelector('.itemnumber').textContent.trim()))
      .map(div => {
        let a = div.querySelector('a')
        return {
          sessionTitle: a.textContent.trim(),
          // test: a.attributes.href.value,
          sessionHref: new URL(a.attributes.href.value, params.url || paaUrl).href,
          author: div.querySelector('.author').textContent.trim(),
          itemNumber: div.querySelector('.itemnumber').textContent.trim(),
        }
      })
    // slice for dev/testing
    return params.slice ? items.slice(0, params.slice) : items
  })
  // for each identified session, create/return promise
  // to get additional info at session page (sessionHref)
  .then(sessions => Promise.all(sessions.map(
    (session, idx) => axios
      .get(session.sessionHref)
      .then(response => {
        const { document } = (new JSDOM(response.data)).window
        return document
      })
      .then(doc => {
        let dateTime = doc.querySelector('.datetime')
        if (dateTime) {
          session.sessionDatetime = dateTime.textContent.trim() // $('.datetime').eq(0).text()
        } else {
          console.error('No datetime for', session)
        }

        session.sessionLocation = doc.querySelector('.location')
          .textContent.trim() // $('.location').eq(0).text()

        session.sessionAbstract = doc.querySelector('.abstract')
          .textContent.trim().replace(/\s+/g, ' ')

        // person groups appear to be a key/value pairs
        // usually a "discussant" and "session chair"
        // (and an empty group)
        session.personGroups = [...doc.querySelectorAll('.persongroup')]
          .map(personGroup => {
            let group = personGroup.querySelector('.group')
            if (group) {
              group = group.textContent
                .trim()
                .replace(/\s+/g, ' ')
                // .replace(/\W/g, '')
            }
            let people = personGroup.querySelector('.people')
            if (people) {
              people = people
                .textContent
                .trim()
                .replace(/\s+/g, ' ')
            }
            if (group && group !== '') {
              // console.log(group, people)
              return `${group} ${people || ''}`
            } else return null
          })
          // filter out the empty persongroups
          .filter(personGroup => !!personGroup)
          // reconvert to human readable string
          .join('; ')

        // papers are listed in their own div
        // convert class-identified fields in each div
        session.papers = [...doc.querySelectorAll('.paper')]
          .map(paper => ({
            paperTime: paper.querySelector('.papertime')
              .textContent.trim(),
            paperNumber: paper.querySelector('.papernumber')
              .textContent.trim(),
            paperTitle: paper.querySelector('.papertitle a')
              .textContent.trim().replace(/\s+/g, ' '),
            paperAuthors: paper.querySelector('.paperauthors')
              .textContent.trim().replace(/\s+/g, ' '),
            paperHref: new URL(
              paper.querySelector('a').attributes.href.value,
              session.sessionHref
            ).href
          }))
        return session
      })
  )))
  // replace each session with an array of
  // papers that each have the session data
  .then(sessions =>
    sessions.map(session =>
      session.papers.map(paper => {
        let row = Object.assign({}, session)
        delete row.papers
        return Object.assign(row, paper)
      })
  ))
  // flatten the nested arrays of paper data from previous
  .then(paperSessions =>
    // using this method (via MDN):
    // var flattened = [[0, 1], [2, 3], [4, 5]].reduce(
    //   function(accumulator, currentValue) {
    //     return accumulator.concat(currentValue);
    //   },
    //   []
    // );
    paperSessions.reduce((acc, cur) => acc.concat(cur), [])
  )
  // for each paper, get an abstract from paper's page
  .then(papers => Promise.all(papers.map(paper =>
    axios.get(paper.paperHref)
      .then(response => {
        const { document } = (new JSDOM(response.data)).window
        return document
      })
      .then(doc => {
        let abstract = doc.querySelector('.abstract')
        if (abstract) {
          paper.paperAbstract = abstract.textContent.trim().replace(/\s+/g, ' ')
        } else {
          // console.error('Abstract not posted for', paper)
          paper.paperAbstract = 'Not posted as of ' + new Date().toString()
        }
        // console.log(paper.abstract)
        return paper
      })
      .catch(err => {
        console.error('Failed to retrieve abstract for', paper.paperTitle, paper.paperHref)
        fs.writeFileSync(params.errorLogFile || errorLogFile, err, error => {
          if (error) {
            throw error
          } else {
            return console.log('Error logged in', params.errorLogFile || errorLogFile)
          }
        })
        paper.abstract = 'Not available; try ' + paper.paperHref
        return paper
      })
  )))
  // convert object to CSV
  .then(rows => {
    try {
      return json2csv(rows, {
        fields: headers
      })
    } catch (e) {
      throw e
    }
  })
  // write to file
  .then(csv => {
    fs.writeFileSync(params.outputFile || outputFile, csv, err => {
      if (err) {
        throw err
      } else {
        return console.log('Done')
      }
    })
  })
  .catch(err => {
    console.error('Something went wrong:', err)
  })

// paaSessionCompiler({
//   // slice: 3 // for testing
// })

module.exports = paaSessionCompiler