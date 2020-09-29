const config = require('config')
const uuid = require('uuid/v4')
const { AuroraDB } = require('./AuroraDB')

const tokensTableName = config.get('tokens.tableName')

class TokensTable extends AuroraDB {
  static getTokens() {
    const sql = `
      SELECT *
      FROM ${tokensTableName}
      LIMIT ${this.limit}
    `
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error)
      .then((response) => response.records)
      .then((records) =>
        records.map((record) => ({
          id: record[0].longValue,
          token: record[1].stringValue,
          accountId: record[2].stringValue,
          accountPaid: record[3].booleanValue,
          active: record[4].booleanValue,
          maxConcurrency: record[5].longValue
        }))
      )
  }
  static getTokensByAccountId(id) {
    const sql = `
      SELECT *
      FROM ${tokensTableName}
      WHERE account_id = '${id}'
      LIMIT ${this.limit}
    `
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error).then((response) =>
      response.records.map((record) => ({
        id: record[0].longValue,
        token: record[1].stringValue,
        accountId: record[2].stringValue,
        accountPaid: record[3].booleanValue,
        active: record[4].booleanValue,
        maxConcurrency: record[5].longValue
      }))
    )
  }

  static getToken(token = '') {
    const sql = `
      SELECT active, max_concurrency
      FROM ${tokensTableName}
      WHERE token = '${token}'
      LIMIT 1
    `
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error)
      .then((response) => response.records)
      .then((records) => {
        if (records.length === 0) return {}

        const active = records[0][0].booleanValue
        const maxConcurrency = records[0][1].longValue
        return { active, maxConcurrency }
      })
  }

  static validateToken(token = '') {
    return TokensTable.getToken(token).then((record) => record.active === true)
  }

  static createByAccountId(
    accountId,
    accountPaid,
    active = false,
    maxConcurrency = null
  ) {
    if (typeof accountPaid !== 'boolean') {
      throw new TypeError('need account active information.')
    }

    const token = uuid()
    const sql = `
      INSERT INTO ${tokensTableName} (token, account_id, account_paid, active, max_concurrency)
      VALUES ('${token}', '${accountId}', ${accountPaid}, ${active}, ${maxConcurrency})`
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error).catch((err) => {
      if (
        err.message.includes(`Detail: Key (token)=(${token}) already exists.`)
      ) {
        return this.createByAccountId(
          accountId,
          accountPaid,
          active,
          maxConcurrency
        )
      }
      throw err
    })
  }

  static activateToken(token = '') {
    const sql = `
      UPDATE ${tokensTableName}
      SET active = true
      WHERE token = '${token}'
    `
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error)
  }

  static deactivateToken(token = '') {
    const sql = `
      UPDATE ${tokensTableName}
      SET active = false
      WHERE token = '${token}'
    `
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error)
  }

  static regenerateToken(token = '') {
    const newToken = uuid()
    const sql = `
      UPDATE ${tokensTableName}
      SET token = '${newToken}'
      WHERE token = '${token}'
    `
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error)
      .then((result) => {
        if (result.numberOfRecordsUpdated === 0) return null
        return newToken
      })
      .catch((err) => {
        if (
          err.message.includes(
            `Detail: Key (token)=(${newToken}) already exists.`
          )
        ) {
          return this.regenerateToken(token)
        }
        throw err
      })
  }

  static readByAccountId(accountId) {
    const sql = `
      SELECT *
      FROM ${tokensTableName}
      WHERE account_id = '${accountId}'
    `
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error).then(
      (result) => result.sqlStatementResults
    )
  }

  static deleteByToken(token) {
    const sql = `
      DELETE
      FROM ${tokensTableName}
      WHERE token = '${token}'
    `
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error).then(
      (result) => result.sqlStatementResults
    )
  }

  static deleteByaccountId(accountId) {
    const sql = `
      DELETE
      FROM ${tokensTableName}
      WHERE account_id = '${accountId}'
    `
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error).then(
      (result) => result.sqlStatementResults
    )
  }

  static returnAllInactive(accountId = '') {
    let sql = `
      SELECT *
      FROM ${tokensTableName}
      WHERE active = false
    `

    if (Number.isInteger(accountId) || typeof accountId === 'string') {
      sql += ` AND account_id = '${accountId}'`
    }

    const params = this.createParams(sql)
    return this.executeStatement(params, new Error)
      .promise()
      .then((result) => result.sqlStatementResults)
  }

  static updateMaxConcurrency(id, maxConcurrency) {
    const sql = `
      UPDATE ${tokensTableName}
      SET max_concurrency = ${maxConcurrency}
      WHERE id = ${id}
    `

    const params = this.createParams(sql)
    return this.executeStatement(params, new Error)
  }
}

module.exports = { TokensTable }
