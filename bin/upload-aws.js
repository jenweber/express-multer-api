'use strict';

require('dotenv').load();

console.log(process.argv);

const fs = require('fs');
const fileType = require('file-type');
const AWS = require('aws-sdk');
const crypto = require('crypto');

let filename = process.argv[2];
let comment = process.argv[3] || '';

const randomString = () =>
  new Promise((resolve, reject) =>
    crypto.randomBytes(16, (err, data) =>
      err ? reject(err) : resolve(data.toString('hex'))
  )
);

new Promise((resolve, reject) =>
  fs.readFile(filename, (err, data) =>
     err ? reject(err) : resolve(data)
  )
).then((data) => {
  let file = { data }; // creating an object with key data, like file = {data: data}
  file.type = fileType(data) || {ext: 'bin', mime: 'application/octet-stream'}; // now file = {data: data, type: whatever the fileType is}. If no match is found for the filetype, default value is octet stream, a generic term for a bunch of bits and bytes
  return file;
}).then((file) => { // here is where you start building the connection to AWS
  let directory = new Date().toISOString().split('T')[0];
  let s3 = new AWS.S3();
  return randomString().then((randomHexString) => ({
      ACL: 'public-read',
      Body: file.data,
      Bucket: 'bucketname', // find the bucket name in the AWS online console, or create a bucket
      ContentType: file.type.mime,
      Key: `${directory}/${randomHexString}.${file.type.ext}`
  })).then((params) =>
      new Promise((resolve, reject) =>
      s3.upload(params, (err, data) =>
        err ? reject(err) : resolve(data)
    )
  )
);
}).then((awsS3) => {
  console.log('success');
  console.log(awsS3);
}).catch(console.error);
