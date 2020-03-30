const https = require('https');
const config = require('config');
const log = require('./log');

const line = {};

/**
 * send message to line
 * @param msg
 */
line.send = function (formData) {
    log.info(`[send to line] : ${JSON.stringify(formData)}`);

    // const postData = JSON.stringify({
    //     to: config.get('line.to'),
    //     messages: messages
    // });

    const options = {
        hostname: config.get('line.hostname'),
        port: 443,
        path: config.get('line.push-path'),
        method: 'POST',
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': 'Bearer ' + config.get('line.token')
        },
        formData : {
            'message' : formData.message,
            'imageThumbnail': formData.imageThumbnail,
            'imageFullsize': formData.imageFullsize
        }
    };

    const postReq = https.request(options, function (postRes) {
        log.info(`[line response] status : ${JSON.stringify(postRes.statusCode)}`);
        log.info(`[line response] HEADERS : ${JSON.stringify(postRes.headers)}`);

        postRes.on('data', function (chunk) {
            log.info(`[line response] body : ${chunk}`);
        })
    });

    postReq.on('error', function (e) {
        log.error(`[line call error] body : ${JSON.stringify(e)}`, e);
    });

    postReq.write(postData);
    postReq.end();
};

module.exports = line;
