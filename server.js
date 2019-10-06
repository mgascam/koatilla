const zlib = require('zlib');
const fsPromise = require('fs').promises;
const fs = require('fs');

const Koa = require('koa');
const cors = require('@koa/cors');
const Router = require('koa-router');
const router = new Router();
const proxy = require('koa-proxy');

const app = new Koa();
app.use(cors({origin: '*'}));

router.get('/', (ctx, next) => {
  ctx.body = 'Hello!';
 });

// logger
app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.get('X-Response-Time');
  console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});

app.use(async (ctx, next) => {
  const path = `${ctx.request.path.split('/').pop()}.json`;
  try {
    let rawData = await fsPromise.readFile(path);
    ctx.body = JSON.parse(rawData);
  } catch (err) {
    await next();
    console.log('file not found retrieving from proxy');
  }
});

app.use(async (ctx, next) => {
  await next();
  // TODO extract to function
  zlib.brotliDecompress(ctx.response.body, (err, buffer) => {
    if (err) {
      console.error(err)
    }
    if (buffer) {
      const wstream = fs.createWriteStream(`${ctx.request.path}.json`);
      wstream.write(buffer);
      wstream.end();
    }
  })
});

app.use(proxy({
  host: 'https://pokeapi.co',
  match: /^\/api\/v2\//
}));
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000);
