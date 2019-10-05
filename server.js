const Koa = require('koa');
const proxy = require('koa-proxy');
const cors = require('@koa/cors');
const zlib = require('zlib');

const fs = require('fs');

const bodyParser = require('koa-body-parser');

const app = new Koa();

app.use(cors({origin: '*'}));
app.use(bodyParser());

// logger
app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.get('X-Response-Time');
  console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});

// x-response-time
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});

app.use(async (ctx, next) => {
  await next();
  zlib.brotliDecompress(ctx.response.body, (err, buffer) => {
    if (err) throw err;
    const wstream = fs.createWriteStream(`${ctx.request.path.split('/').pop()}.json`);
    wstream.write(buffer);
    wstream.end();
  })
});

app.use(proxy({
  host: 'https://pokeapi.co'
}));

app.listen(3000);
