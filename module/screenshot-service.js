const Queue = require('better-queue');
const moment = require('moment');
const Crc32 = require('crc-32');
const line = require('./line');
const slack = require('./slack');
const oss = require('./oss');
const s3 = require('./s3');
const shooter = require('./shooter');
const log = require('./log');
const sharp = require('sharp');
const config = require('config');

const delayingDuration = config.get("delayingDuration");
const snoozingDuration = config.get("snoozingDuration");
const afterServiceDuration = config.get("afterServiceDuration");

const afterServiceCheckInterval = 10 * 1000;
const maxDuration = 20 * 60 * 1000;

const alertSentBox = {};
const afterServiceBox = {};
let alertBox = {};

/**
 * timer for after service alerting
 */
setTimeout(afterService, afterServiceCheckInterval);

/**
 * define queue
 * @type {Queue}
 */
const q = new Queue((alerts, callback) => {
    let error = null;
    try {
        doIt(alerts);
    } catch (e) {
        error = e;
    }
    callback(error, null);
}, {
    maxTimeout: 5 * 60 * 1000,
    batchSize: 100,
    batchDelay: delayingDuration
});

/**
 * exported function for alert queueing
 * @param alert
 */
module.exports = function queuing(alert) {
    log.info(`[queued] : ${JSON.stringify(alert)}`);
    alert.queueingTime = moment();
    q.push(alert, () => {});
};

/**
 * check alerts and alerting if needs
 * @param alerts
 * @returns {Promise<void>}
 */
async function doIt(alerts) {
    for (alert of alerts) {
        const key = alert.instances.replace(',', '_').replace('%','_') + "_" + alert.layout + "_" + alert.name;
        alertBox[key] = alert;
    }

    for (alertKey in alertBox) {
        const alert = alertBox[alertKey];

        const alertSent = alertSentBox[alertKey];
        if (alertSent && alertSent.sendingTime.clone().add(snoozingDuration, 'ms').isAfter(moment())) {
            log.info('[alert snoozed] : ' + JSON.stringify(alert));
            continue;
        }
        delete alertSentBox[alertKey];

        alert.sendingTime = moment();
        const from = alert.queueingTime.clone().subtract(10, 'minutes');
        const to = moment.min(moment(), alert.queueingTime.clone().add(2, 'minutes'));

        await sendAlert(alert, 'ALERT', from, to);

        alertSentBox[alertKey] = alert;
        afterServiceBox[alertKey] = alert;
    }

    clearAlertBox();
    removeExpiredAlertSent();
}

/**
 * check after service alert box and alert it again if needs
 * @returns {Promise<void>}
 */
async function afterService() {
    for (alertKey in afterServiceBox) {
        const alert = afterServiceBox[alertKey];
        if (alert && alert.sendingTime.clone().add(afterServiceDuration, 'ms').isBefore(moment())) {
            log.info('[alert after service] : ' + JSON.stringify(alert));
            delete afterServiceBox[alertKey];

            const modeMessage = `Reminding Screenshot ${Math.trunc(afterServiceDuration/60/1000)}min after previous alert.`;
            const from = alert.queueingTime.clone().subtract(5, 'minutes');
            const to = moment.min(moment(), alert.queueingTime.clone().add(maxDuration, 'ms'));

            await sendAlert(alert, modeMessage, from, to);
        }
    }
    setTimeout(afterService, afterServiceCheckInterval);
}


async function makeResizedImage(dir, fileName, size, resultFileName) {
    await sharp(`${dir}/${fileName}`)
        .withoutEnlargement(false)
        .resize(size, size)
        .max()
        .toFile(`${dir}/${resultFileName}`);

    log.info(`[image resized] : ${resultFileName}`);
}

async function sendAlert(alert, modeMessage, from , to) {
    log.info('[prepare to send] : ' + JSON.stringify(alert));

    let url = `${alert.url}&instances=${alert.instances}&from=${from.format('x')}&to=${to.format('x')}`;
    url = alert.layout ? `${url}&layout=${alert.layout}` : url;
    url = alert.activesid ? `${url}&activesid=${alert.activesid}` : `${url}&activesid=0`;

    const fileName = `sc_${Math.abs(Crc32.str(alert.instances))}_${Math.abs(Crc32.str(alert.layout))}_${from.format('YYYYMMDDHHmmss')}_${to.format('YYYYMMDDHHmmss')}.jpg`;
    const regularFileName = `r1_${fileName}`;
    const thumbnailFileName = `r2_${fileName}`;

    const outDir = './out';

    await shooter.makeScreenShot(url, outDir, fileName);
    await makeResizedImage(outDir, fileName, 1024, regularFileName);
    await makeResizedImage(outDir, fileName, 240, thumbnailFileName);

    let imageUrl;
    let thumbnailUrl;

    if(config.get("s3.accessKeyId")) {
        await s3.uploadToS3(regularFileName, outDir);
        await s3.uploadToS3(regularFileName, outDir);
        imageUrl = s3.getS3ImageUrl(regularFileName);
        thumbnailUrl = s3.getS3ImageUrl(thumbnailFileName);
    } else {
        await oss.uploadToOss(regularFileName, outDir);
        await oss.uploadToOss(thumbnailFileName, outDir);
        imageUrl = oss.getOssImageUrl(regularFileName);
        thumbnailUrl = oss.getOssImageUrl(thumbnailFileName);
    }

    if(config.get("slack.webhook-path")) {
        const data = {
            attachments: [
                {
                    color: "#E74C3C",
                    title: `[SCREENSHOT] ${modeMessage}`,
                    title_link: imageUrl,
                    fallback: "image can not display.",
                    fields: [
                        {
                            title: "Duration",
                            value: `${from.format('(MM/DD) HH:mm')} ~ ${to.format('HH:mm')}`,
                            short: false
                        },
                        {
                            title: "Original message",
                            value: alert.message,
                            short: false
                        }
                    ],
                    image_url: imageUrl
                }
            ]
        };
        slack.send(data);
    }

    if(config.get("line.token")) {
        // const messages = [
        //     {
        //         type: 'text',
        //         text: `[SCREENSHOT] ${modeMessage}\n` +
        //         `[Duration] ${from.format('(MM/DD) HH:mm')} ~ ${to.format('(MM/DD) HH:mm')}\n` +
        //         `[Original Message] ${alert.message}`
        //     },
        //     {
        //         type: 'image',
        //         originalContentUrl: imageUrl,
        //         previewImageUrl: thumbnailUrl
        //     }
        // ];

        const formData = {
            message: `[SCREENSHOT] ${modeMessage}\n` +
                `[Duration] ${from.format('(MM/DD) HH:mm')} ~ ${to.format('(MM/DD) HH:mm')}\n` +
                `[Original Message] ${alert.message}`,
            imageThumbnail: thumbnailUrl,
            imageFullsize: imageUrl
        };

        line.send(formData);
    }
}

function clearAlertBox() {
    alertBox = {};
}

function removeExpiredAlertSent() {
    for (alertKey in alertSentBox) {
        const alertSent = alertSentBox[alertKey];
        if (alertSent && alertSent.sendingTime.clone().add(snoozingDuration, 'ms').isBefore(moment())) {
            delete alertSentBox[alertKey];
        }
    }
}
