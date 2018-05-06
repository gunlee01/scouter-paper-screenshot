const config = require('config');
const co = require('co');
const OSS = require('ali-oss');
const log = require('./log');

const ossClient = new OSS({
    region: config.get('oss.region'),
    accessKeyId: config.get('oss.accessKeyId'),
    accessKeySecret: config.get('oss.accessKeySecret')
});

const oss = {};

oss.uploadToOss = async function(fileName, fileDir) {
    await co(function* () {
        ossClient.useBucket(config.get('oss.bucketName'));
        yield ossClient.put(`${config.get('oss.dir')}/${fileName}`, `${fileDir}/${fileName}`);
    }).catch(function (err) {
        log.error(`[upload oss error] body : ${JSON.stringify(err)}`, err);
    });
};

oss.getOssImageUrl = function (regularFileName) {
    return `https://${config.get('oss.bucketName')}.oss-cn-beijing.aliyuncs.com/${config.get('oss.dir')}/${regularFileName}`;
};

module.exports = oss;
