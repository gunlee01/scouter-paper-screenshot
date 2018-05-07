const express = require('express');
const router = express.Router();
const queueing = require('../module/screenshot-service');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('scouter');
});

router.get('/screenshot', function(req, res, next) {
    const alert = {
        url: req.query.url,
        name: req.query.name,
        instances: req.query.instances,
        layout: req.query.layout,
        message: req.query.message
    };
    queueing(alert);

    res.send('scouter');
});

module.exports = router;
