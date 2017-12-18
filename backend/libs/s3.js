const aws = require('aws-sdk')
const util = require('util')
const s3_map = new Map

function sortObjectKeys(object) {
  return Object.keys(object).sort().reduce((acc, key) => {
    acc[key] = object[key]
    return acc
  }, {})
}

function s3(credentials) {
  const json_credentials = JSON.stringify(sortObjectKeys(credentials))

  if(s3_map.has(json_credentials))
    return s3_map.get(json_credentials)

  const s3 = new aws.S3(credentials)
  const s3_listBuckets = util.promisify(s3.listBuckets.bind(s3))

  s3.listBuckets = async (...args) =>
    s3.buckets = s3.buckets || await s3_listBuckets(...args)

  s3.listObjectsV2 = util.promisify(s3.listObjectsV2.bind(s3))
  s3.putObject = util.promisify(s3.putObject.bind(s3))
  s3.deleteObject = util.promisify(s3.deleteObject.bind(s3))
  s3.getObject = util.promisify(s3.getObject.bind(s3))

  s3_map.set(json_credentials, s3)

  return s3
}

module.exports = s3
