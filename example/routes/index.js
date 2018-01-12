const express = require('express');
const router = express.Router();
const path = require('path');

const pubPath = path.join(__dirname, '../public');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(path.join(pubPath, 'index.html'));
});

module.exports = router;
