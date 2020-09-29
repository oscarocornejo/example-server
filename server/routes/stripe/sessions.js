const bodyParser = require('body-parser')
const stripe = require('stripe')(process.env.STRIPE_API_KEY)
const router = require('express').Router()
const { AccountsTable } = require('../../classes/AccountsTable')
const { BrowserPlansTable } = require('../../classes/BrowserPlansTable')
const { TokensTable } = require('../../classes/TokensTable')
const {
  AccountsActivationTable
} = require('../../classes/AccountsActivationTable')
const { Mailer } = require('../../classes/Mailer')

const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET
const eventsToListenFor = [
  'checkout.session.completed',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.subscription.updated'
]

router.post(
  '/stripe/hook',
  bodyParser.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature']
    let event
    let craneAccountId
    let data

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
      data = event.data.object
    } catch (err) {
      console.log(err)
      return res
        .status(400)
        .send(`Webhook Error: ${err.message}`)
        .end()
    }

    // Return a response to acknowledge receipt of the event
    if(!eventsToListenFor.includes(event.type)) {
      return res
        .status(200)
        .json({ received: true })
        .end()
    }

    // what do we want to handle
    // - user creating and paying for a subscription for the first time.
    // - user downgrading or upgrading a subscription
    // - user failing payment
    if(event.type === 'invoice.payment_succeeded') {
      let user = await AccountsTable.getUserByStripeCustomerId(data.customer)
      let count = 0
      while (!user && count < 20) {
        setTimeout(async () => {
          count++
          await AccountsTable.getUserByStripeCustomerId(data.customer)
        }, 500)
      }

      const tokens = await TokensTable.getTokensByAccountId(user.id)
      for(const token of tokens) {
        await TokensTable.activateToken(token.token)
      }
    }

    if(event.type === 'invoice.payment_failed') {
      let user = await AccountsTable.getUserByStripeCustomerId(data.customer)
      let count = 0
      while (!user && count < 20) {
        setTimeout(async () => {
          count++
          await AccountsTable.getUserByStripeCustomerId(data.customer)
        }, 500)
      }

      const tokens = await TokensTable.getTokensByAccountId(user.id)
      for(const token of tokens) {
        await TokensTable.deactivateToken(token.token)
      }
    }

    if (
      event.type === 'customer.subscription.updated'
    ) {
      const planId = data.plan.id
      const stripeCustomerId = data.customer
      const plan = await BrowserPlansTable.getPlanByStripeId(planId)
      const user = await AccountsTable.getUserByStripeCustomerId(stripeCustomerId)
      const tokens = await TokensTable.getTokensByAccountId(user.id)
      
      await AccountsTable.updateAccountById(user.id, {
        planId: plan.id,
        maxConcurrency: plan.maxConcurrency
      })
      for(const token of tokens) {
        await TokensTable.updateMaxConcurrency(token.id, plan.maxConcurrency)
      }
    }

    if (event.type === 'checkout.session.completed') {
      craneAccountId = data.client_reference_id
      const stripeCustomerId = data.customer
      const planId = data.metadata.planId
      const browserPlan = await BrowserPlansTable.getPlanByStripeId(planId)
      await AccountsTable.updateAccountById(craneAccountId, {
        stripeCustomerId,
        planId: browserPlan.id,
        accountPaid: true,
        maxConcurrency: browserPlan.maxConcurrency
      })
      await TokensTable.createByAccountId(
        craneAccountId,
        true,
        true,
        browserPlan.maxConcurrency
      )
      const hash = await AccountsActivationTable.createActivationHash(craneAccountId)
      await AccountsTable.addPlanToUser(craneAccountId, browserPlan.id)
      const user = await AccountsTable.getUserById(craneAccountId)
      await Mailer.sendActivationEmail({
        toEmail: user.email,
        name: user.name,
        activationHash: hash
      })
    }

    return res
      .status(200)
      .json({ received: true })
      .end()
  }
)

module.exports = router
