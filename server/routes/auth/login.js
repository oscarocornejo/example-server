const router = require('express').Router()
const { AccountsTable } = require('../../classes/AccountsTable')

router.post('/auth', async (req, res) => {
  const { email, password } = req.body
  const user = await AccountsTable.validateUser(email, password)
  // if exists in db:
  if (!user) {
    return res
      .status(404)
      .json({})
      .end()
  }

  req.session.user = {
    id: user.id,
    email,
    name: user.name,
    accountPaid: user.accountPaid,
    active: user.active
  }

  return res
    .status(200)
    .json({})
    .end()
})

module.exports = router
