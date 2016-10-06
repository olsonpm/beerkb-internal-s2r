'use strict';


//---------//
// Imports //
//---------//

const bPromise = require('bluebird')
  , chalk = require('chalk')
  , childProcess = require('child_process')
  , Koa = require('koa')
  , moment = require('moment')
  , path = require('path')
  , portfinder = require('portfinder')
  , sqliteToRest = require('sqlite-to-rest')
  ;


//------//
// Init //
//------//

const bGetPort = bPromise.promisify(portfinder.getPort)
  , dbPath = path.join(__dirname, 'beer.sqlite3')
  , getSqliteRouter = sqliteToRest.getSqliteRouter
  , highlight = chalk.green
  ;

initDailyDbReset();


//------//
// Main //
//------//

const app = new Koa();

const run = () => bGetPort()
  .tap(port => {
    getSqliteRouter({ dbPath })
      .then(router => {
        app.use(router.routes())
          .use(router.allowedMethods())
          .listen(port);

        console.log('beerkb-internal-s2r server listening on port: ' + highlight(port));
      });
  });


//-------------//
// Helper Fxns //
//-------------//

function initDailyDbReset() {
  const dbDir = path.join(__dirname, '../src/internal-rest-api')
    , resetFile = path.join(dbDir, 'beer.reset.sqlite3')
    , curFile = path.join(dbDir, 'beer.sqlite3')
    , msTilMidnight =  moment().add(1, 'day').startOf('day').diff(moment())
    ;

  setTimeout(() => {
    resetDb();
    setInterval(resetDb, 86400000);
  }, msTilMidnight);

  function resetDb() { childProcess.exec('cp ' + resetFile + ' ' + curFile); }
}

//---------//
// Exports //
//---------//

module.exports = { run };
