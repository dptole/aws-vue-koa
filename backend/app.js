
function backendApp(_package) {
  const koa = require('koa')
  const koa_json_body = require('koa-json-body')
  const koa_route = require('koa-route')
  const multer_lib = require('./libs/multer.js')
  const s3_lib = require('./libs/s3.js')
  const koa_static = require('koa-static')
  const querystring = require('querystring')
  const fs = require('fs')
  const path = require('path')
  const http_server = new koa
  const build_folder = _package.config.folders.build
  const http_server_port = _package.config.server.http.port
  const koa_json_body_1kb = koa_json_body({limit: '1kb', fallback: true})
  const upload_folder = _package.config.folders.upload
  const upload = multer_lib.upload({destination: upload_folder})
  const upload_single_file = upload.single('file')

  http_server.use((ctx, next) => {
    ctx.query = querystring.parse(ctx.querystring)
    return next()
  })

  http_server.use((ctx, next) => {
    ctx.set('content-type', 'application/json;charset=utf-8')
    const date = new Date
    console.log(date.toJSON(), 'TZ:' + date.getTimezoneOffset(), ctx.request.method, ctx.request.url)
    console.log(
      JSON.stringify({
        payload: ctx.request.body,
        querystring: ctx.query
      }, 0, 2)
    )
    return next()
  })

  http_server.use(
    koa_route.post('/api/login', (ctx, next) => {
      return koa_json_body_1kb(ctx, next).then(_ => {
        if(!(
          'access_key_id' in ctx.request.body &&
          'secret_access_key' in ctx.request.body
        )) {
          ctx.status = 400
          return ctx.body = {
            error: 'bad request'
          }
        }

        const s3_instance = s3_lib({
          accessKeyId: ctx.request.body.access_key_id,
          secretAccessKey: ctx.request.body.secret_access_key
        })

        return s3_instance.listBuckets().then(buckets =>
          ctx.body = buckets
        ).catch(error => {
          console.log(error)
          ctx.status = 401
          ctx.body = error
        })
      })
    })
  )

  http_server.use(
    koa_route.get('/api/list_objects', ctx => {
      if(!(
        'access_key_id' in ctx.query &&
        'secret_access_key' in ctx.query &&
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
        secretAccessKey: ctx.query.secret_access_key
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

  http_server.use(
    koa_route.get(/\/api\/get_object\/(.*)/, ctx => {
      if(!(
        'access_key_id' in ctx.query &&
        'secret_access_key' in ctx.query &&
        'bucket' in ctx.query &&
        'key' in ctx.query
      )) {
        ctx.status = 400
        return ctx.body = {
          error: 'bad request'
        }
      }

      const s3_instance = s3_lib({
        accessKeyId: ctx.query.access_key_id,
        secretAccessKey: ctx.query.secret_access_key
      })

      return s3_instance.getObject({
        Bucket: ctx.query.bucket,
        Key: ctx.query.key
      }).then(object => {
        console.log(object)
        ctx.body = object.Body
        ctx.set('content-type', object.ContentType)
      }).catch(error => {
        console.log(error)
        ctx.status = 401
        ctx.body = error
      })
    })
  )

  http_server.use(
    koa_route.delete('/api/delete_object', ctx => {
      if(!(
        'access_key_id' in ctx.query &&
        'secret_access_key' in ctx.query &&
        'bucket_name' in ctx.query &&
        'key' in ctx.query
      )) {
        ctx.status = 400
        return ctx.body = {
          error: 'bad request'
        }
      }

      const s3_instance = s3_lib({
        accessKeyId: ctx.query.access_key_id,
        secretAccessKey: ctx.query.secret_access_key
      })

      return s3_instance.deleteObject({
        Bucket: ctx.query.bucket_name,
        Key: ctx.query.key
      }).then(deleted => {
        console.log(deleted)
        ctx.body = deleted
      }).catch(error => {
        console.log(error)
        ctx.status = 401
        ctx.body = {
          error: 'unable to delete the object'
        }
      })
    })
  )

  http_server.use(
    koa_route.post('/api/upload_object', ctx => {
      return upload_single_file(ctx, _ => {
        console.log(ctx.req.file)

        if(!(
          'access_key_id' in ctx.query &&
          'secret_access_key' in ctx.query &&
          'bucket_name' in ctx.query &&
          'filename' in ctx.query &&
          'prefix' in ctx.query &&
          'acl' in ctx.query
        )) {
          ctx.status = 400
          return ctx.body = {
            error: 'bad request'
          }
        }

        const s3_instance = s3_lib({
          accessKeyId: ctx.query.access_key_id,
          secretAccessKey: ctx.query.secret_access_key
        })

        return s3_instance.putObject({
          Body: fs.readFileSync(path.resolve(upload_folder, ctx.req.file.originalname)),
          Bucket: ctx.query.bucket_name,
          ACL: ctx.query.acl,
          ContentType: ctx.req.file.mimetype,
          Key: path.join(ctx.query.prefix, ctx.query.filename)
        }).then(data => {
          ctx.body = data
        }).catch(error => {
          console.log(error)
          ctx.status = 500
          ctx.body = {
            error: 'unable to put the object'
          }
        })
      })
    })
  )

  http_server.use(koa_static(build_folder))
  http_server.listen(http_server_port, _ => console.log('Running on port: ' + http_server_port))
}

module.exports = backendApp
