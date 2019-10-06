const zlib = require('zlib');
const fs = require('fs');

const Koa = require('koa');
const Router = require('koa-router');
const router = new Router();
const proxy = require('koa-proxy');

const app = new Koa();

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
  await next();
  zlib.brotliDecompress(ctx.response.body, (err, buffer) => {
    if (err) {
      console.error(err)
    }
    if (buffer) {
      const wstream = fs.createWriteStream(`${ctx.request.path.split('/').pop()}.json`);
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
