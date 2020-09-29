const config = require('config')
const uuid = require('uuid/v4')
const { AuroraDB } = require('./AuroraDB')

// immutable variables
const accountsActivationTable = config.get('accountsActivation.tableName')

class AccountsActivationTable extends AuroraDB {
  /**
   * Returns hash after storing in DB
   * @param {String} accountId
   * @returns {String}
   */
  static createActivationHash(accountId) {
    const hash = uuid()
    const sql = `
      INSERT INTO ${accountsActivationTable} (activation_hash, account_id)
      VALUES ('${hash}', '${accountId}')`
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error)
      .then(() => hash)
      .catch((err) => {
        if (
          err.message.includes(
            `Detail: Key (activation_hash)=(${hash}) already exists.`
          )
        ) {
          return this.createActivationHash(accountId)
        }
        throw err
      })
  }

  /**
   * Returns userId if valid
   * @param {String} hash
   * @returns {Object}
   */
  static hashIsValid(hash) {
    const sql = `
      SELECT *
      FROM ${accountsActivationTable}
      WHERE activation_hash = '${hash}'
      LIMIT 1
    `
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error)
      .then((response) =>
        response.records.map((rec) => ({
          id: rec[0].longValue,
          activationHash: rec[1].stringValue,
          accountId: rec[2].stringValue
        }))
      )
      .then((records) => {
        if (records.length === 0) return false

        return records[0]
      })
  }

  /**
   * Returns hash
   * @param {String} accountId
   * @returns {String}
   */
  static selectHashByAccountId(accountId) {
    const sql = `
      SELECT activation_hash
      FROM ${accountsActivationTable}
      WHERE account_id = '${accountId}'
      LIMIT 1
    `
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error).then(
      (response) =>
        response.records.map((rec) => ({
          activationHash: rec[0].stringValue
        }))[0]
    )
  }

  /**
   * deletes hash from table
   * @param {String} hash
   */
  static deleteHash(hash) {
    const sql = `
      DELETE FROM ${accountsActivationTable}
      WHERE activation_hash = '${hash}'
    `
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error)
  }
}

module.exports = { AccountsActivationTable }
