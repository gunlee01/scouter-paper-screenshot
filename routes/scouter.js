var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('scouter');
});

router.get('/screenshot', function(req, res, next) {
    res.send('scouter');
});

module.exports = router;
