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
  , enableDestroy = require('server-destroy')
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

let server;


//------//
// Main //
//------//

const app = new Koa();

const run = () => bGetPort()
  .then(port => {

    // assuming run only happens once
    initDailyDbReset();

    return bPromise.props({
      router: getSqliteRouter({ dbPath })
      , port
    });
  })
  .then(({ router, port }) => {
    server = app.use(router.routes())
      .use(router.allowedMethods())
      .listen(port);

    enableDestroy(server);

    console.log('beerkb-internal-s2r server listening on port: ' + highlight(port));

    return { server, port };
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
