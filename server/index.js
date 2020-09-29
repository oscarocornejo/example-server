const express = require('express')
const consola = require('consola')
const { Nuxt, Builder } = require('nuxt')
const bodyParser = require('body-parser')
const cookieSession = require('cookie-session')
const app = express()

// Import and Set Nuxt.js options
const config = require('../nuxt.config.js')
config.dev = process.env.NODE_ENV !== 'production'

// Routes
const login = require('./routes/auth/login')
const logout = require('./routes/auth/logout')
const register = require('./routes/auth/register')
const user = require('./routes/auth/user')
const isActive = require('./routes/user/isActive')
const deactivate = require('./routes/tokens/deactivate')
const activate = require('./routes/tokens/activate')
const regenerate = require('./routes/tokens/regenerate')
const list = require('./routes/tokens/list')
const plans = require('./routes/plans')

// user route
const updatePassword = require('./routes/user/update-password')
const userActivation = require('./routes/user/activation')

// stripe routes
const checkout = require('./routes/stripe/checkout')
const sessions = require('./routes/stripe/sessions')
const billingPortal = require('./routes/stripe/billing-portal')

app.use((req, res, next) => {
  if (req.originalUrl.includes('/stripe/hook')) {
    next()
  } else {
    bodyParser.json()(req, res, next)
  }
})
// app.use(bodyParser.urlencoded({ extended: true }))
app.use(
  cookieSession({
    name: 'session',
    keys: ['key1', 'key2', 'key3'],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  })
)
app.use(
  '/api',
  login,
  logout,
  user,
  register,
  plans,
  checkout,
  isActive,
  deactivate,
  activate,
  regenerate,
  list,
  sessions,
  updatePassword,
  userActivation,
  billingPortal
)

async function start() {
  // Init Nuxt.js
  const nuxt = new Nuxt(config)

  const { host, port } = nuxt.options.server

  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  } else {
    await nuxt.ready()
  }

  // Give nuxt middleware to express
  app.use(nuxt.render)

  // Listen the server
  app.listen(port, host)
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  })
}
start()
