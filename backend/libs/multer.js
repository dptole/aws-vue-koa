
const koa_multer = require('koa-multer')

const multer = {
  upload({destination}) {
    const storage = koa_multer.diskStorage({
      filename(request, file, callback) {
        callback(null, file.originalname)
      },
      destination(request, file, callback) {
        callback(null, destination)
      }
    })

    return upload = koa_multer({storage: storage})
  }
}

module.exports = Object.create(multer)
