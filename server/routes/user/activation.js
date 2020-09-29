const { AccountsTable } = require('../../classes/AccountsTable')
const {
  AccountsActivationTable
} = require('../../classes/AccountsActivationTable')
const router = require('express').Router()

router.get('/activation/:hash', async (req, res) => {
  const { hash } = req.params
  if (!hash) {
    return res
      .status(401)
      .json({})
      .end()
  }

  const hashRecord = await AccountsActivationTable.hashIsValid(hash)
  if (!hashRecord) {
    return res
      .status(401)
      .json({})
      .end()
  }

  const { activationHash, accountId } = hashRecord
  await AccountsActivationTable.deleteHash(activationHash)
  await AccountsTable.activateAccount(accountId)

  return res.redirect('/me/dashboard')
})

module.exports = router
