const aws = require('aws-sdk')
const util = require('util')

function s3(credentials) {
  const s3 = new aws.S3(credentials)

  s3.listObjectsV2 = util.promisify(s3.listObjectsV2.bind(s3))
  s3.listBuckets = util.promisify(s3.listBuckets.bind(s3))
  s3.putObject = util.promisify(s3.putObject.bind(s3))
  s3.deleteObject = util.promisify(s3.deleteObject.bind(s3))
  s3.getObject = util.promisify(s3.getObject.bind(s3))

  return s3
}

module.exports = s3
