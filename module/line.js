const https = require('https');
const config = require('config');
const log = require('./log');
const request = require('request');

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

    const apiUrl = 'https://' + config.get('line.hostname') + config.get('line.push-path');

    const headers = {
        'Content-Type': 'multipart/form-data',
        'Authorization': 'Bearer ' + config.get('line.token')
    };

    const form = {
        'message': formData.message,
        'imageThumbnail': formData.imageThumbnail,
        'imageFullsize': formData.imageFullsize
    };

    log.info(`[line request] url : ${apiUrl}`);
    log.info(`[line request] header : ${JSON.stringify(headers)}`);
    log.info(`[line request] form : ${JSON.stringify(form)}`);

    request.post({
        url: apiUrl,
        headers: headers,
        form: form
    }, function (err, httpResponse, body) {
        if (err) {
            log.error(`[line call error] body : ${JSON.stringify(err)}`, err);
        } else {
            log.info(`[line response] httpResponse : ${JSON.stringify(httpResponse)}`);
            log.info(`[line response] body : ${body}`);
        }
    });

    // const options = {
    //     hostname: config.get('line.hostname'),
    //     port: 443,
    //     path: config.get('line.push-path'),
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'multipart/form-data',
    //         'Authorization': 'Bearer ' + config.get('line.token')
    //     },
    //     formData : {
    //         'message' : formData.message,
    //         'imageThumbnail': formData.imageThumbnail,
    //         'imageFullsize': formData.imageFullsize
    //     }
    // };
    //
    // const postReq = https.request(options, function (postRes) {
    //     log.info(`[line response] status : ${JSON.stringify(postRes.statusCode)}`);
    //     log.info(`[line response] HEADERS : ${JSON.stringify(postRes.headers)}`);
    //
    //     postRes.on('data', function (chunk) {
    //         log.info(`[line response] body : ${chunk}`);
    //     })
    // });
    //
    // postReq.on('error', function (e) {
    //     log.error(`[line call error] body : ${JSON.stringify(e)}`, e);
    // });
    //
    // postReq.write();
    // postReq.end();
};

module.exports = line;
