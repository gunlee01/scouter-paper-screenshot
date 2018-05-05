const queueing = require('./module/screenshot-service');

(function () {
    const alert = {
        url: 'http://localhost:3000/#/paper?realtime=false&longterm=false&xlogElapsedTime=10000',
        instances: '1305369747,-725152471',
        layout: 'link-default',
        message: 'Test1 is high!'
    };
    queueing(alert);
})();