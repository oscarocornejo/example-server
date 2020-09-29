const { TokensTable } = require('../../classes/TokensTable')
const router = require('express').Router()

router.post('/tokens/regenerate', async (req, res) => {
  if (!('token' in req.body)) {
    return res
      .status(404)
      .json({ error: 'invalid body' })
      .end()
  }

  if (!req.session || !req.session.user) {
    return res
      .status(401)
      .json({ error: 'need to be logged in to request' })
      .end()
  }

  const newToken = await TokensTable.regenerateToken(req.body.token)

  if (!newToken) {
    return res
      .status(200)
      .json({ error: 'Error occurred. Unable to regenerate token.' })
      .end()
  }

  return res
    .status(200)
    .json({ token: newToken })
    .end()
})

module.exports = router
