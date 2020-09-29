const config = require('config')
const { AuroraDB } = require('./AuroraDB')

// immutable variables
const browserPlansTable = config.get('plans.browser.tableName')

class BrowserPlansTable extends AuroraDB {
  static createPlan(stripePlanId, name, maxConcurrency, pricing) {
    const sql = `
      INSERT INTO ${browserPlansTable} (stripe_plan_id, name, max_concurrency, pricing)
      VALUES ('${stripePlanId}', '${name}', '${maxConcurrency}', '${pricing}')`
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error)
  }

  static getPlans() {
    const sql = `
      SELECT id, name, max_concurrency, pricing
      FROM ${browserPlansTable}
      LIMIT ${this.limit}`
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error).then((response) =>
      response.records.map((record) => ({
        id: record[0].longValue,
        name: record[1].stringValue,
        maxConcurrency: record[2].longValue,
        pricing: parseInt(record[3].stringValue, 10)
      }))
    )
  }

  static getPlanByStripeId(id) {
    const sql = `
      SELECT *
      FROM ${browserPlansTable}
      WHERE stripe_plan_id = '${id}'
      LIMIT 1
    `

    const params = this.createParams(sql);
    return this.executeStatement(params, new Error)
      .then(res => res.records.map(record => ({
        id: record[0].longValue,
        stripePlanId: record[1].stringValue,
        name: record[2].stringValue,
        maxConcurrency: record[3].longValue,
        pricing: parseInt(record[4].stringValue, 10)
      }))[0])
  }

  static getPlanById(id) {
    const sql = `
      SELECT *
      FROM ${browserPlansTable}
      WHERE id = ${id}
      LIMIT 1
    `

    const params = this.createParams(sql);
    return this.executeStatement(params, new Error)
      .then(res => res.records.map(record => ({
        id: record[0].longValue,
        stripePlanId: record[1].stringValue,
        name: record[2].stringValue,
        maxConcurrency: record[3].longValue,
        pricing: parseInt(record[4].stringValue, 10)
      }))[0])
  }

  static updatePlanById(id, {
    stripePlanId,
    name,
    maxConcurrency,
    pricing,
  } = {}) {
    const setArgs = [];

    if (name) setArgs.push(`name = '${name}'`)
    if (stripePlanId) setArgs.push(`stripe_plan_id = '${stripePlanId}'`)
    if (maxConcurrency) setArgs.push(`max_concurrency = ${maxConcurrency}`)
    if (pricing) setArgs.push(`pricing = ${pricing}`)

    if (setArgs.length === 0) throw new Error('No valid arguments provided.')

    const setValues = setArgs.length > 1
      ? setArgs.join(', ')
      : setArgs[0]

    const sql = `
      UPDATE ${browserPlansTable}
      SET ${setValues}
      WHERE id = ${id}`

    const params = this.createParams(sql)
    return this.executeStatement(params, new Error)
  }
}

module.exports = { BrowserPlansTable }
