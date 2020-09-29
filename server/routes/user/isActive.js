const { AccountsTable } = require('../../classes/AccountsTable')
const router = require('express').Router()

router.get('/user/is-active', async (req, res) => {
  if (!req.session.user.email) {
    return res
      .status(401)
      .json({})
      .end()
  }

  const user = await AccountsTable.getUserByEmail(req.session.user.email)
  req.session.user.accountPaid = user.accountPaid
  req.session.user.active = user.active

  return res
    .status(200)
    .json({
      accountPaid: req.session.user.accountPaid,
      active: req.session.user.active
    })
    .end()
})

module.exports = router
