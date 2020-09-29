const config = require('config')
const bcrypt = require('bcrypt')
const uuid = require('uuid/v4')
const { AuroraDB } = require('./AuroraDB')
const { BrowserPlansTable } = require('./BrowserPlansTable')
const saltRounds = 10

// immutable variables
const accountsTableName = config.get('accounts.tableName')

class AccountsTable extends AuroraDB {
  static hash(text) {
    return bcrypt.hash(text, saltRounds)
  }
  static compareHash(text, hash) {
    return bcrypt.compare(text, hash)
  }
  static async createUser(
    name,
    email,
    password,
    accountPaid = false,
    active = false
  ) {
    password = await this.hash(password)

    const id = uuid()
    const sql = `
      INSERT INTO ${accountsTableName} (id, name, email, password, account_paid, active, max_concurrency, plan_id)
      VALUES ('${id}', '${name}', '${email}', '${password}', ${accountPaid}, ${active}, null, null)
    `
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error).catch((err) => {
      if (
        err.message.includes(`Detail: Key (email)=(${email}) already exists.`)
      ) {
        throw new Error('Duplicate email')
      }
      if (err.message.includes(`Detail: Key (id)=(${id}) already exists.`)) {
        return this.createUser(name, email, password, maxConcurrency, planId, {
          accountPaid,
          active
        })
      }
      throw err
    })
  }

  static async updateUserPassword (userId, password) {
    password = await this.hash(password)
    const sql = `
      UPDATE ${accountsTableName}
      SET password = '${password}'
      WHERE id = '${userId}'
    `;
    const params = this.createParams(sql)

    return this.executeStatement(params, new Error)
  }

  static async validateUser(email, password) {
    const sql = `
      SELECT id, name, password, account_paid, active
      FROM ${accountsTableName}
      WHERE email = '${email}'
      LIMIT 1`
    const params = this.createParams(sql)
    const record = (
      await this.executeStatement(params, new Error).then((response) =>
        response.records.map((record) => ({
          id: record[0].stringValue,
          name: record[1].stringValue,
          password: record[2].stringValue,
          accountPaid: record[3].booleanValue,
          active: record[4].booleanValue
        }))
      )
    )[0]
    if (!record) return false
    const validated = await this.compareHash(password, record.password)
    if (!validated) return false

    return record
  }

  static getUserById(id) {
    const sql = `
      SELECT id, name, email, account_paid, active, max_concurrency, plan_id, stripe_customer_id
      FROM ${accountsTableName}
      WHERE id = '${id}'
      LIMIT 1`
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error).then(
      (response) =>
        response.records.map((record) => ({
          id: record[0].stringValue,
          name: record[1].stringValue,
          email: record[2].stringValue,
          accountPaid: record[3].booleanValue,
          active: record[4].booleanValue,
          maxConcurrency: record[5].longValue,
          planId: record[6].longValue,
          stripeCustomerId: record[7].stringValue
        }))[0]
    )
  }

  static getUserByEmail(email) {
    const sql = `
      SELECT id, name, email, account_paid, active, max_concurrency, plan_id, stripe_customer_id
      FROM ${accountsTableName}
      WHERE email = '${email}'
      LIMIT 1`
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error).then(
      (response) =>
        response.records.map((record) => ({
          id: record[0].stringValue,
          name: record[1].stringValue,
          email: record[2].stringValue,
          accountPaid: record[3].booleanValue,
          active: record[4].booleanValue,
          maxConcurrency: record[5].longValue,
          planId: record[6].longValue,
          stripeCustomerId: record[7].stringValue
        }))[0]
    )
  }

  static getUserByStripeCustomerId(id) {
    const sql = `
      SELECT id, name, email, account_paid, active, max_concurrency, plan_id, stripe_customer_id
      FROM ${accountsTableName}
      WHERE stripe_customer_id = '${id}'
    `
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error).then(
      (response) =>
        response.records.map((record) => ({
          id: record[0].stringValue,
          name: record[1].stringValue,
          email: record[2].stringValue,
          accountPaid: record[3].booleanValue,
          active: record[4].booleanValue,
          maxConcurrency: record[5].longValue,
          planId: record[6].longValue,
          stripeCustomerId: record[7].stringValue
        }))[0]
    )
  }

  static getUsers() {
    const sql = `
      SELECT id, name, email, account_paid, active, max_concurrency, plan_id, stripe_customer_id
      FROM ${accountsTableName}
      LIMIT ${this.limit}`
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error).then((response) =>
      response.records.map((record) => ({
        id: record[0].stringValue,
        name: record[1].stringValue,
        email: record[2].stringValue,
        accountPaid: record[3].booleanValue,
        active: record[4].booleanValue,
        maxConcurrency: record[5].longValue,
        planId: record[6].longValue,
        stripeCustomerId: record[7].stringValue
      }))
    )
  }

  static async addPlanToUser(id, planId) {
    const plan = await BrowserPlansTable.getPlanById(planId);
    const sql = `
      UPDATE ${accountsTableName}
      SET plan_id = '${plan.id}', max_concurrency = ${plan.maxConcurrency}
      WHERE id = '${id}'`
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error)
  }

  static setAccountUnpaid(id) {
    const sql = `
      UPDATE ${accountsTableName}
      SET account_paid = false
      WHERE id = '${id}'`
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error)
  }

  static setAccountPaid(id) {
    const sql = `
      UPDATE ${accountsTableName}
      SET account_paid = true
      WHERE id = '${id}'`
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error)
  }

  static activateAccount(id) {
    const sql = `
      UPDATE ${accountsTableName}
      SET active = true
      WHERE id = '${id}'`
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error)
  }

  static setStripeCustomerId(accountId, customerId) {
    const sql = `
      UPDATE ${accountsTableName}
      SET stripe_customer_id = '${customerId}'
      WHERE id = '${accountId}'`

    const params = this.createParams(sql)
    return this.executeStatement(params, new Error)
  }

  static updateAccountById(id, {
    name,
    email,
    password,
    accountPaid,
    active,
    maxConcurrency,
    planId,
    stripeCustomerId
  } = {}) {
    const setArgs = [];

    if (name) setArgs.push(`name = '${name}'`)
    if (email) setArgs.push(`email = '${email}'`)
    if (password) setArgs.push(`password = '${password}'`)
    if (accountPaid) setArgs.push(`account_paid = ${accountPaid}`)
    if (active) setArgs.push(`active = ${active}`)
    if (maxConcurrency) setArgs.push(`max_concurrency = ${maxConcurrency}`)
    if (planId) setArgs.push(`plan_id = ${planId}`)
    if (stripeCustomerId) setArgs.push(`stripe_customer_id = '${stripeCustomerId}'`)

    if (setArgs.length === 0) throw new Error('No valid arguments provided.')

    const setValues = setArgs.length > 1
      ? setArgs.join(', ')
      : setArgs[0]

    const sql = `
      UPDATE ${accountsTableName}
      SET ${setValues}
      WHERE id = '${id}'`

    const params = this.createParams(sql)
    return this.executeStatement(params, new Error)
  }
}

module.exports = { AccountsTable }
