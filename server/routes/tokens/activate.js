const { TokensTable } = require('../../classes/TokensTable')
const router = require('express').Router()

router.post('/tokens/activate', async (req, res) => {
  if (!('token' in req.body)) {
    return res
      .status(404)
      .json({ error: 'invalid body' })
      .end()
  }

  if (!req.session.email) {
    return res
      .status(401)
      .json({ error: 'need to be logged in to request' })
      .end()
  }

  await TokensTable.activateToken(req.body.token)
  return res
    .status(200)
    .json({})
    .end()
})

module.exports = router
