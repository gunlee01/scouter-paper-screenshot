const express = require('express');
const router = express.Router();
const queueing = require('../module/screenshot-service');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('scouter');
});

router.get('/screenshot', function(req, res, next) {
    const alert = {
        url: 'http://localhost:3000/#/paper?realtime=false&longterm=false&xlogElapsedTime=10000',
        instances: '1305369747,-725152471',
        layout: 'link-default',
        message: 'Test3 is high!'
    };
    queueing(alert);

    res.send('scouter');
});

module.exports = router;
