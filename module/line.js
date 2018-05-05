const https = require('https');
const config = require('config');

const line = {};

/**
 * send message to line
 * @param msg
 */
line.send = function (messages) {
    console.log(`[send to line] msg -> ${messages}`);
    const postData = JSON.stringify({
        to: config.get('line.to'),
        messages: messages
    });

    const options = {
        hostname: config.get('line.hostname'),
        port: 443,
        path: config.get('line.push-path'),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': config.get('line.token'),
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const postReq = https.request(options, function (postRes) {
        console.log('STATUS:' + postRes.statusCode);
        console.log('HEADERS:' + JSON.stringify(postRes.headers));

        postRes.on('data', function (chunk) {
            console.log('[RES]:' + chunk);
        })
    });

    postReq.on('error', function (e) {
        console.log('problem with request:' + e.message);
    });

    postReq.write(postData);
    postReq.end();
};

module.exports = line;
