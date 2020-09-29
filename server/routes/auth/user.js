const router = require('express').Router()
const { AccountsTable } = require('../../classes/AccountsTable')

router.get('/auth/user', async (req, res) => {
  if (
    !req.session ||
    typeof req.session.user !== 'object' ||
    !req.session.user.email
  ) {
    return res
      .status(401)
      .json({})
      .end()
  }

  try {
    const { accountPaid, active } = await AccountsTable.getUserByEmail(req.session.user.email)
    req.session.user.accountPaid = accountPaid
    req.session.user.active = active
  } catch(err) {
    return res
      .status(401)
      .json({})
      .end()
  }

  const user = { ...req.session.user }
  return res
    .status(200)
    .json({ user })
    .end()
})

module.exports = router
