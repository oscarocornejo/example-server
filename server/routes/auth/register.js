const router = require('express').Router()
const { AccountsTable } = require('../../classes/AccountsTable')
const { TokensTable } = require('../../classes/TokensTable')
const {
  AccountsActivationTable
} = require('../../classes/AccountsActivationTable')

router.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body.data

  try {
    await AccountsTable.createUser(name, email, password)
  } catch (err) {
    console.log(err)
    return res.status(401).json({ message: err.message })
  }

  return res.status(200).json({})
})

module.exports = router
