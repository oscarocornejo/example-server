const { TokensTable } = require('../../classes/TokensTable')
const router = require('express').Router()

router.get('/tokens', async (req, res) => {
  if (!req.session || typeof req.session.user !== 'object') {
    return res
      .status(401)
      .json({ error: 'need to be logged in to request' })
      .end()
  }

  const tokens = await TokensTable.getTokensByAccountId(req.session.user.id)
  return res
    .status(200)
    .json({ tokens })
    .end()
})

module.exports = router
