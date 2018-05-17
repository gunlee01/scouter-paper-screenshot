const http = require('http');
const moment = require('moment');

(function test_counter_day_over() {
    const start = moment('2018-05-12 23:59:52');
    //const end = moment('2018-05-12 23:59:59');
    //const start = moment('2018-05-13 00:00:01');
    const end = moment('2018-05-13 00:00:15');

    const url = `http://localhost:6188/scouter/v1/counter/TPS?objHashes=[-157543838,1097578689]&startTimeMillis=${start.valueOf()}&endTimeMillis=${end.valueOf()}`;

    http.get(url, res => {
        res.setEncoding("utf8");
        let body = "";
        res.on("data", data => {
            body += data;
        });
        res.on("end", () => {
            body = JSON.parse(body);

            for(const resultByObj of body.result) {
                console.log('start :' + moment(Number(resultByObj.startTimeMillis)).format('MM/DD HH:mm:ss'));
                console.log('end :' + moment(Number(resultByObj.endTimeMillis)).format('MM/DD HH:mm:ss'));
                console.log('times');
                for(var i = 0; i < resultByObj.timeList.length; i++) {
                    console.log(`\t${moment(Number(resultByObj.timeList[i])).format('MM/DD HH:mm:ss')} ${Math.round(Number(resultByObj.valueList[i])*10)/10}`);
                }
            }
        });
    });

})();