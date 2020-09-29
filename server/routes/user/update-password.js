const { AccountsTable } = require('../../classes/AccountsTable')
const router = require('express').Router()

router.post('/user/update-password', async (req, res) => {
  const { password } = req.body;
  if (!req.session.user.email) {
    return res
      .status(401)
      .json({})
      .end()
  }

  try {
    await AccountsTable.updateUserPassword(req.session.user.id, password)
  } catch (_err) {
    return res
      .status(401)
      .json({})
      .end()
  }

  return res
    .status(200)
    .json({})
    .end()
})

module.exports = router
