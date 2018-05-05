const Queue = require('better-queue');
const moment = require('moment');
const puppeteer = require('puppeteer');
const Crc32 = require('crc-32');
const config = require('config');
const line = require('./line');
const co = require('co');
const OSS = require('ali-oss');
const sharp = require('sharp');

const ossClient = new OSS({
    region: config.get('oss.region'),
    accessKeyId: config.get('oss.accessKeyId'),
    accessKeySecret: config.get('oss.accessKeySecret')
});

const delayingDuration = 30 * 1000;
const snoozingDuration = 5 * 60 * 1000;
const afterServiceDuration = 10 * 60 * 1000;
const afterServiceCheckInterval = 10 * 1000;

const maxDuration = 15 * 60 * 1000;

const alertSentBox = {};
const afterServiceBox = {};
let alertBox = {};

setTimeout(afterService, afterServiceCheckInterval);

const q = new Queue((alerts, callback) => {
    let error = null;
    try {
        doShot(alerts);
    } catch (e) {
        error = e;
    }
    callback(error, null);
}, {
    maxTimeout: 5 * 60 * 1000,
    batchSize: 100,
    batchDelay: delayingDuration
});

const queueing = function queueing(alert) {
    alert.queueingTime = moment();
    q.push(alert, () => {});
};

async function doShot(alerts) {
    console.log("[doShot] start");

    for (alert of alerts) {
        const key = alert.instances.replace(',', '_').replace('%','_') + "_" + alert.layout;
        alertBox[key] = alert;
    }

    for (alertKey in alertBox) {
        const alert = alertBox[alertKey];

        const alertSent = alertSentBox[alertKey];
        if (alertSent && alertSent.sendingTime.add(snoozingDuration, 'ms').isAfter(moment())) {
            console.log('alert snoozed : ' + JSON.stringify(alert));
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

async function makeScreenShot(url, outDir, fileName) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    try {
        await page.setViewport({width: 480, height: 720,});
        await page.goto(url, {waitUntil: 'networkidle0', timeout: 60000});
        await page.screenshot({
            path: `${outDir}/${fileName}`,
            type: 'jpeg',
            quality: 92,
            fullPage: true
        });
        await browser.close();

    } catch (e) {
        console.log(e)
    }
}

async function makeResizedImage(dir, fileName, size, resultFileName) {
    await sharp(`${dir}/${fileName}`)
        .resize(size, size)
        .max()
        .toFile(`${dir}/${resultFileName}`);
}

async function uploadToOss(fileName, fileDir) {
    await co(function* () {
        ossClient.useBucket(config.get('oss.bucketName'));
        yield ossClient.put(`${config.get('oss.dir')}/${fileName}`, `${fileDir}/${fileName}`);
    }).catch(function (err) {
        console.log(err);
    });
}

function getImageUrl(regularFileName) {
    return `https://${config.get('oss.bucketName')}.oss-cn-beijing.aliyuncs.com/${config.get('oss.dir')}/${regularFileName}`;
}

function getOssImageUrl(regularFileName) {
    return `https://${config.get('oss.bucketName')}.oss-cn-beijing.aliyuncs.com/${config.get('oss.dir')}/${regularFileName}`;
}

async function sendAlert(alert, modeMessage, from , to) {

    const url = `${alert.url}&instances=${alert.instances}&layout=${alert.layout}&from=${from.format('x')}&to=${to.format('x')}`;
    const fileName = `sc_${Math.abs(Crc32.str(alert.instances))}_${Math.abs(Crc32.str(alert.layout))}_${from.format('YYYYMMDDHHmmss')}_${to.format('YYYYMMDDHHmmss')}.jpg`;
    const regularFileName = `r1_${fileName}`;
    const thumbnailFileName = `r2_${fileName}`;

    const outDir = './out';

    await makeScreenShot(url, outDir, fileName);
    await makeResizedImage(outDir, fileName, 1024, regularFileName);
    await makeResizedImage(outDir, fileName, 240, thumbnailFileName);

    await uploadToOss(regularFileName, outDir);
    await uploadToOss(thumbnailFileName, outDir);

    const messages = [
        {
            type: 'text',
            text: `[screenshot] ${modeMessage}\n` +
                `[Duration] ${from.format('MM/DD HH:mm')} ~ ${to.format('MM:DD HH:mm')}\n` +
                `[Original Message] ${alert.message}`
        },
        {
            type: 'image',
            originalContentUrl: `${getOssImageUrl(regularFileName)}`,
            previewImageUrl: `${getOssImageUrl(thumbnailFileName)}`
        }
    ];
    line.send(messages);
}

async function afterService() {
    for (alertKey in afterServiceBox) {
        const alert = afterServiceBox[alertKey];
        if (alert && alert.sendingTime.add(afterServiceDuration, 'ms').isAfter(moment())) {
            console.log('alert after service : ' + JSON.stringify(alert));
            delete afterServiceBox[alertKey];

            const modeMessage = `auto shot after ${Math.trunc(afterServiceDuration/60/1000)}min of alert`;
            const from = alert.queueingTime.clone().subtract(5, 'minutes');
            const to = moment.min(moment(), alert.queueingTime.clone().add(maxDuration, 'ms'));

            await sendAlert(alert, modeMessage, from, to);
        }
    }
    setTimeout(afterService, afterServiceCheckInterval);
}

function clearAlertBox() {
    alertBox = {};
}

function removeExpiredAlertSent() {
    for (alertKey in alertSentBox) {
        const alertSent = alertSentBox[alertKey];
        if (alertSent && alertSent.sendingTime.add(snoozingDuration, 'ms').isBefore(moment())) {
            delete alertSentBox[alertKey];
        }
    }
}

module.exports = queueing;