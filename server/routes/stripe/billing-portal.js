const { AccountsTable } = require('../../classes/AccountsTable')
const stripe = require('stripe')(process.env.STRIPE_API_KEY)
const router = require('express').Router()

const baseURL =
  process.env.NODE_ENV === 'production'
    ? process.env.DOMAIN_NAME
    : 'http://localhost:3000'

router.post('/create_billing_portal', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await AccountsTable.getUserById(userId)
  
    stripe.billingPortal.sessions.create(
      {
        customer: user.stripeCustomerId,
        return_url: `${baseURL}/me/dashboard`,
      },
      function(err, session) {
        if(err) return res.status(400).end()
        res.status(200).send({ url: session.url}).end()
      }
    );
  } catch(err) {
    return res.status(400).end()
  }
})

module.exports = router
