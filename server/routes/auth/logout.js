const router = require('express').Router()

router.delete('/auth', (req, res) => {
  req.session = null
  res.status(200).json({})
})

module.exports = router
