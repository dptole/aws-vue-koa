
function backendApp(_package) {
  const koa = require('koa')
  const koa_json_body = require('koa-json-body')
  const koa_route = require('koa-route')
  const multer_lib = require('./libs/multer.js')
  const s3_lib = require('./libs/s3.js')
  const koa_static = require('koa-static')
  const http_server = new koa
  const build_folder = _package.config.folders.build
  const http_server_port = _package.config.server.http.port
  const s3_map = new Map
  const upload = multer_lib.upload({
    destination: _package.config.folders.upload
  })

  http_server.use(koa_json_body({limit: '1kb', fallback: true}))

  http_server.use((ctx, next) => {
    ctx.response.header['content-type'] = 'application/json;charset=utf-8'
    const date = new Date
    console.log(date.toJSON(), 'TZ:' + date.getTimezoneOffset(), ctx.request.method, ctx.request.url)
    return next()
  })

  http_server.use(
    koa_route.post('/api/login', async ctx => {
      if(ctx.request.body.access_key_id && ctx.request.body.secret_access_key && ctx.request.body.region) {
        const credential_string = `${ctx.request.body.access_key_id}:${ctx.request.body.secret_access_key}:${ctx.request.body.region}`

        if(s3_map.has(credential_string))
          return ctx.body = s3_map.get(credential_string).buckets

        const s3_instance = s3_lib({
          accessKeyId: ctx.request.body.access_key_id,
          secretAccessKey: ctx.request.body.secret_access_key,
          region: ctx.request.body.region
        })

        return s3_instance.listBuckets().then(buckets => {
          s3_map.set(
            credential_string,
            {
              s3_instance,
              buckets
            }
          )
          ctx.body = buckets
        }).catch(error => {
          ctx.status = 401
          ctx.body = error
        })
      } else {
        ctx.status = 400
        ctx.body = {
          error: 'bad request'
        }
      }
    })
  )

  http_server.use(koa_static(build_folder))
  http_server.listen(http_server_port, _ => console.log('Running on port: ' + http_server_port))
}

module.exports = backendApp
