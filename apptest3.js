const queueing = require('./module/screenshot-service');

(function () {
    const alert = {
        url: 'http://demo.scouterapm.com:6188/extweb/index.html#/paper?address=demo.scouterapm.com&port=6188&realtime=false&longterm=false&xlogElapsedTime=8000',
        instances: '1463674242%2C-1180057655%2C-30645576%2C2033927919%2C1291312847%2C911699808%2C1315531795%2C-1502713930%2C1139150454%2C-796172661',
        layout: 'default',
        message: 'Test1 is high!'
        //activesid: '100'
    };
    queueing(alert);
})();

