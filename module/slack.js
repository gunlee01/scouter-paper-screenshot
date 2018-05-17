const https = require('https');
const config = require('config');
const log = require('./log');

const slack = {};

/**
 * send message to slack
 * @param msg
 */
slack.send = function (data) {
    log.info(`[send to slack] : ${JSON.stringify(data)}`);
    const postData = JSON.stringify(data);

    const options = {
        hostname: config.get('slack.hostname'),
        port: 443,
        path: config.get('slack.webhook-path'),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const postReq = https.request(options, function (postRes) {
        log.info(`[slack response] status : ${JSON.stringify(postRes.statusCode)}`);
        log.info(`[slack response] HEADERS : ${JSON.stringify(postRes.headers)}`);

        postRes.on('data', function (chunk) {
            log.info(`[slack response] body : ${chunk}`);
        })
    });

    postReq.on('error', function (e) {
        log.error(`[slack call error] body : ${JSON.stringify(e)}`, e);
    });

    postReq.write(postData);
    postReq.end();
};

module.exports = slack;
