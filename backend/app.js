
function backendApp(_package) {
  const koa = require('koa')
  const koa_json_body = require('koa-json-body')
  const koa_route = require('koa-route')
  const multer_lib = require('./libs/multer.js')
  const s3_lib = require('./libs/s3.js')
  const koa_static = require('koa-static')
  const querystring = require('querystring')
  const http_server = new koa
  const build_folder = _package.config.folders.build
  const http_server_port = _package.config.server.http.port
  const upload = multer_lib.upload({
    destination: _package.config.folders.upload
  })

  http_server.use(koa_json_body({limit: '1kb', fallback: true}))

  http_server.use((ctx, next) => {
    ctx.response.header['content-type'] = 'application/json;charset=utf-8'
    const date = new Date
    console.log(date.toJSON(), 'TZ:' + date.getTimezoneOffset(), ctx.request.method, ctx.request.url)
    console.log(ctx.request.body)
    return next()
  })

  http_server.use((ctx, next) => {
    ctx.query = querystring.parse(ctx.querystring)
    return next()
  })

  http_server.use(
    koa_route.post('/api/login', ctx => {
      if(!(
        'access_key_id' in ctx.request.body &&
        'secret_access_key' in ctx.request.body &&
        'region' in ctx.request.body
      )) {
        ctx.status = 400
        return ctx.body = {
          error: 'bad request'
        }
      }

      const s3_instance = s3_lib({
        accessKeyId: ctx.request.body.access_key_id,
        secretAccessKey: ctx.request.body.secret_access_key,
        region: ctx.request.body.region
      })

      return s3_instance.listBuckets().then(buckets =>
        ctx.body = buckets
      ).catch(error => {
        console.log(error)
        ctx.status = 401
        ctx.body = error
      })
    })
  )

  http_server.use(
    koa_route.get('/api/list_obejcts', ctx => {
      if(!(
        'access_key_id' in ctx.query &&
        'secret_access_key' in ctx.query &&
        'region' in ctx.query &&
        'bucket' in ctx.query &&
        'max_keys' in ctx.query &&
        'prefix' in ctx.query &&
        'start_after' in ctx.query &&
        'delimiter' in ctx.query
      )) {
        ctx.status = 400
        return ctx.body = {
          error: 'bad request'
        }
      }

      const s3_instance = s3_lib({
        accessKeyId: ctx.query.access_key_id,
        secretAccessKey: ctx.query.secret_access_key,
        region: ctx.query.region
      })

      return s3_instance.listObjectsV2({
        Bucket: ctx.query.bucket,
        MaxKeys: ctx.query.max_keys,
        Prefix: ctx.query.prefix,
        Delimiter: ctx.query.delimiter,
        StartAfter: ctx.query.start_after,
      }).then(objects =>
        ctx.body = objects
      ).catch(error => {
        console.log(error)
        ctx.status = 401
        ctx.body = error
      })
    })
  )

  http_server.use(koa_static(build_folder))
  http_server.listen(http_server_port, _ => console.log('Running on port: ' + http_server_port))
}

module.exports = backendApp
