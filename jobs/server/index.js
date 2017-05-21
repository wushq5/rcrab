'use strict';

const jsonServer = require('json-server');
const enableDestroy = require('server-destroy');
const chokidar = require('chokidar');
const path = require('path');
const fse = require('fs-extra');
const chalk = require('chalk');
const argv = require('../../argv');

let server, port = 8888;
let dbFile = path.join(process.cwd(), '/test/db.json');
let routerFile = path.join(process.cwd(), '/test/router.json');

const watch = () => {
    console.log('Watching : Local Data => %s/test/{db,router}.json\n', process.cwd());
    chokidar
        .watch([dbFile, routerFile])
        .on('change', () => {
            console.log(chalk.green('Restarting...'));
            server.destroy(() => {
                start();
            });
        });
}

const start = () => {
    // load local
    let dbData = {},
        routerData = {};
    try {
        dbData = fse.readJsonSync(dbFile);
        routerData = fse.readJsonSync(routerFile);
    } catch (e) {
        console.warn(chalk.red('FBI Warning : NO Local Data => %s/test/{db,router}.json\n'), process.cwd());
        return;
    }

    let app = jsonServer.create();
    let router = jsonServer.router(dbData);
    router.render = (req, res) => {
        let retData = res.locals.data;
        console.dir(res.locals);
        // console.dir(req);
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') {
            retData = dbData[req.path.replace('/', '')] || {};
        }

        // http resp status
        let _status = req.query._status || 200;
        if (_status * 1 >= 400) {
            res.sendStatus(_status);
        } else {
            res.json(retData);
        }
    }

    app.use(jsonServer.rewriter(router));
    app.use(jsonServer.defaults());
    app.use(router);
    server = app.listen(port, () => {
        console.log('Running : http://localhost:%s\n', port);
    });
    enableDestroy(server);
}

if (argv._ && argv._[0] === 'dev-srv') {
    if (argv.p) {
        port = parseInt(argv.p);
    }
    start();
    watch();
}