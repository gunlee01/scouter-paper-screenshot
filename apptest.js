const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();

    const url = 'http://localhost:3000/?#/paper?realtime=false&longterm=false&from=20180502080000&to=20180502082500&instances=1305369747%2C-725152471&layout=test4&xlogElapsedTime=8000';

    const page = await browser.newPage();

    try {
        await page.setViewport({width: 480, height: 720,});
        await page.goto(url, {waitUntil: 'networkidle0', timeout: 60000});
        await page.screenshot({
            path: './out/paper4.jpg',
            type: 'jpeg',
            quality: 92,
            fullPage: true
        });

        await browser.close();

    } catch (e) {
        console.log(e)
    }
})();