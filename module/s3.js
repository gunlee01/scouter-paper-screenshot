const AWS = require('aws-sdk');
const config = require('config');
const fs = require('fs');
const log = require('./log');

const s3Config = new AWS.Config({
    accessKeyId: config.get("s3.accessKeyId"),
    secretAccessKey: config.get("s3.secretAccessKey"),
    region: config.get("s3.region")
});

const s3Client = new AWS.S3(s3Config);

const s3 = {};

s3.uploadToS3 = async function(fileName, fileDir) {
    const fileStream = fs.createReadStream(`${fileDir}/${fileName}`);
    fileStream.on('error', function (err) {
        if (err) { throw err; }
    });

    const params = {
        Bucket: config.get('s3.bucketName'),
        ACL: "public-read",
        Key: `${config.get('s3.dir')}/${fileName}`,
        Body: fileStream,
        ContentType: "image/jpeg"
    };

    try {
        await s3Client.putObject(params).promise();
    } catch (err) {
        log.error(`[upload s3 error] body : ${JSON.stringify(err)}`, err);
    }

};

s3.getS3ImageUrl = function (regularFileName) {
    return `https://s3.${config.get('s3.region')}.amazonaws.com/${config.get('s3.bucketName')}/${config.get('s3.dir')}/${regularFileName}`;
};
module.exports = s3;
