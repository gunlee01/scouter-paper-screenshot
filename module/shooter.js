const puppeteer = require('puppeteer');
const moment = require('moment');
const log = require('./log');

const shooter = {};

shooter.makeScreenShot = async function(url, outDir, fileName) {
    log.info(`[screenshot cooking start] : ${fileName}`);
    log.info(`[paper-call-url] : ${url}`)

    const start = moment();
    const browser = await puppeteer.launch({args: ['--no-sandbox']});
    const page = await browser.newPage();
    page.on("pageerror", function(err) {
        log.error("page error:" + err.toString());
    });
    page.on("error", function(err) {
        log.error("error: " + err.toString());
    });

    try {
        await page.setViewport({width: 480, height: 720,});
        await page.goto(url, {waitUntil: 'networkidle0', timeout: 60000});

        log.info(`wait for delay`);
        // await delay(30000);
        log.info(`do screen shot`);

        await page.screenshot({
            path: `${outDir}/${fileName}`,
            type: 'jpeg',
            quality: 92,
            fullPage: true
        });
        await browser.close();
        log.info(`[screenshot worked] : ${fileName}, elapsed: ${moment.duration(moment().diff(start)).asSeconds()}`);

    } catch (e) {
        log.error(`[puppeteer error on making scrrenshot] ${JSON.stringify(e)}`, e);
    }
};

function delay(timeout) {
    return new Promise(
        function(resolve) {
            setTimeout(resolve, timeout);
        }
    );
}

module.exports = shooter;
