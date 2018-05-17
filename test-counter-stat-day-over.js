const http = require('http');
const moment = require('moment');

(function test_counter_stat_day_over() {
    const start = '20180509';
    //const end = moment('2018-05-12 23:59:59');
    //const start = moment('2018-05-13 00:00:01');
    const end = '20180512';

    const url = `http://localhost:6188/scouter/v1/counter/stat/HeapUsed?objHashes=[-157543838,1097578689,-1642243768,278027947]&startYmd=${start}&endYmd=${end}`;

    http.get(url, res => {
        res.setEncoding("utf8");
        let body = "";
        res.on("data", data => {
            body += data;
        });
        res.on("end", () => {
            body = JSON.parse(body);

            for(const resultByObj of body.result) {
                console.log('objName :' + resultByObj.objName);
                console.log('fromYmd :' + resultByObj.fromYmd);
                console.log('toYmd :' + resultByObj.toYmd);
                console.log('times');
                for(var i = 0; i < resultByObj.timeList.length; i++) {
                    console.log(`\t${moment(Number(resultByObj.timeList[i])).format('MM/DD HH:mm:ss')} ${Math.round(Number(resultByObj.valueList[i])*10)/10}`);
                }
            }
        });
    });

})();