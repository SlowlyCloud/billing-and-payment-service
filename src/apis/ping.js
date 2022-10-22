const router = require('express').Router()

router.get('/', (req, res) => {
  res.send('pong!')
})

module.exports = router