const zlib = require('zlib');
const fs = require('fs-extra');

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
  const path = `./data${ctx.request.path}.json`;
  try {
    let rawData = await fs.readFile(path);
    ctx.body = JSON.parse(rawData);
  } catch (err) {
    await next();
    console.log('file not found retrieving from proxy');
  }
});

app.use(async (ctx, next) => {
  await next();
  // TODO extract to function
  // Since response is gzipped, decompress
   zlib.gunzip(ctx.response.body, (err, buffer) => {
    if (err) {
      console.error(err)
    }
    if (buffer) {
      fs.outputFile(`./data${ctx.request.path}.json`, buffer, (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
      })
    }
  })
});

app.use(proxy({
  host: 'http://bos.localhost'
}));
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000);
