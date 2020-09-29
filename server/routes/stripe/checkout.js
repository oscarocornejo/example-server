// Set your secret key: remember to change this to your live secret key in production
// See your keys here: https://dashboard.stripe.com/account/apikeys
const { BrowserPlansTable } = require('../../classes/BrowserPlansTable')
const stripe = require('stripe')(process.env.STRIPE_API_KEY)
const router = require('express').Router()

const baseURL =
  process.env.NODE_ENV === 'production'
    ? process.env.DOMAIN_NAME
    : 'http://localhost:3000'

router.post('/checkout/browser/:planId', async (req, res) => {
  const { planId } = req.params
  const { user_id } = req.query

  const plan = await BrowserPlansTable.getPlanById(planId)
  if (!plan || !user_id) {
    return res
      .status(404)
      .json({ error: 'wrong plan id or no user_id provided' })
      .end()
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: plan.stripePlanId,
        quantity: 1
      }
    ],
    metadata: {
      planId: plan.stripePlanId
    },
    client_reference_id: user_id,
    mode: 'subscription',
    success_url: `${baseURL}/me/email_activation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseURL}/me/subscribe`
  })

  res
    .status(200)
    .json({ sessionId: session.id })
    .end()
})

module.exports = router
