const puppeteer = require('puppeteer');
const moment = require('moment');
const log = require('./log');

const shooter = {};

shooter.makeScreenShot = async function(url, outDir, fileName) {
    const start = moment();
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
        log.error(`[upload oss error] body : ${JSON.stringify(e)}`, e);
    }

    log.info(`[screenshot worked] : ${fileName}, elapsed: ${moment.duration(moment().diff(start)).asSeconds()}`);
};


module.exports = shooter;
