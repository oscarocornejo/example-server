const router = require('express').Router()
const { BrowserPlansTable } = require('../classes/BrowserPlansTable')

router.get('/plans/browser', async (req, res) => {
  const plans = await BrowserPlansTable.getPlans()
  
  res.status(200).send(plans).end()
})

module.exports = router
