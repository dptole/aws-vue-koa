
function backendApp(_package) {
  const koa = require('koa')
  const koa_route = require('koa-route')
  const multer_lib = require('./libs/multer.js')
  const s3_lib = require('./libs/s3.js')(_package.config.aws.s3)
  const koa_static = require('koa-static')
  const fs = require('fs')
  const path = require('path')
  const http_server = new koa
  const build_folder = _package.config.folders.build
  const upload_folder = _package.config.folders.upload
  const http_server_port = _package.config.server.http.port
  
  const upload = multer_lib.upload({
    destination: _package.config.folders.upload
  })

  http_server.use((ctx, next) => {
    ctx.response.header['content-type'] = 'application/json;charset=utf-8'
    const date = new Date
    console.log(date.toJSON(), 'TZ:' + date.getTimezoneOffset(), ctx.request.method, ctx.request.url)
    return next()
  })

  http_server.use(
    koa_route.post('/api/put_object', async (ctx, next) => {
      return upload.single('file')(ctx, _ => {
        return s3_lib.putObject({
          Body: fs.readFileSync(path.resolve(upload_folder, ctx.req.file.originalname)),
          Bucket: ctx.query.bucket,
          ACL: 'public-read',
          ContentType: ctx.req.file.mimetype,
          Key: path.join(ctx.query.key, ctx.req.file.originalname)
        }).then(data => {
          ctx.body = data
        }).catch(error => {
          ctx.status = 500
          ctx.body = {
            error: 'unable to put the object'
          }
        })
      })
    })
  )

  http_server.use(
    koa_route.get('/api/list_buckets', async (ctx, next) => {
      return await s3_lib.listBuckets().then(data =>
        ctx.body = data
      ).catch(error => {
        console.log(error)
        ctx.status = 500
        ctx.body = {
          error: 'unable to list buckets'
        }
      })
    })
  )

  http_server.use(
    koa_route.delete('/api/delete_object', async (ctx, next) => {
      return await s3_lib.deleteObject({
        Bucket: ctx.query.bucket,
        Key: ctx.query.key
      }).then(data =>
        ctx.body = data
      ).catch(error => {
        console.log(error)
        ctx.status = 500
        ctx.body = {
          error: 'unable to delete the object'
        }
      })
    })
  )

  http_server.use(
    koa_route.get('/api/list_objects', async (ctx, next) => {
      return await s3_lib.listObjectsV2({
        Bucket: ctx.query.bucket,
        StartAfter: ctx.query.start_after,
        MaxKeys: ctx.query.max_keys
      }).then(data =>
        ctx.body = data
      ).catch(error => {
        console.log(error)
        ctx.status = 500
        ctx.body = {
          error: 'unable to list objects'
        }
      })
    })
  )

  http_server.use(
    koa_route.get('/api/get_object', async (ctx, next) => {
      return await s3_lib.getObject({
        Bucket: ctx.query.bucket,
        Key: ctx.query.key
      }).then(data =>
        ctx.body = data
      ).catch(error => {
        console.log(error)
        ctx.status = 500
        ctx.body = {
          error: 'unable to list objects'
        }
      })
    })
  )

  http_server.use(koa_static(build_folder))
  http_server.listen(http_server_port, _ => console.log('Running on port: ' + http_server_port))
}

module.exports = backendApp
