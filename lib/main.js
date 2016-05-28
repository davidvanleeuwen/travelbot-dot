'use strict';

const koa         = require('koa');
const http        = require('http');
const json        = require('koa-json');
const incoming    = require('./incoming');
let app           = koa();

app.use(incoming(app));
app.use(json());
app = http.createServer(app.callback());

app.listen(process.env.PORT || 3000);
console.log(`$ open http://127.0.0.1:${process.env.PORT || 3000}`);