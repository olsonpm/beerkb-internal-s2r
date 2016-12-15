'use strict';


//---------//
// Imports //
//---------//

const bPromise = require('bluebird')
  , chalk = require('chalk')
  , childProcess = require('child_process')
  , fs = require('fs')
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
  const curFile = dbPath
    , logFile = path.join(__dirname, 'reset.log')
    , msTilMidnight =  moment().add(1, 'day').startOf('day').diff(moment())
    , resetFile = path.join(__dirname, 'beer.reset.sqlite3')
    ;

  setTimeout(() => {
    resetDb();
    setInterval(resetDb, 86400000);
  }, msTilMidnight);

  function resetDb() {
    const command = 'cp ' + resetFile + ' ' + curFile
      , cb = (err, stdout, stderr) => {
        if (err) fs.writeFile(logFile, err.toString());
        else fs.writeFile(logFile, 'stdout: ' + stdout + '\n\nstderr: ' + stderr + '\n');
      }
      ;

    childProcess.exec(command, cb);
  }
}

//---------//
// Exports //
//---------//

module.exports = { run };
