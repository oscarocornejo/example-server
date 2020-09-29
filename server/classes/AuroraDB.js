const { RDSDataService } = require('aws-sdk')
const tableCreation = require('../constants/sql/tableCreation')
const rds = new RDSDataService()

const AWS_SECRET_STORE_ARN = process.env.AWS_SECRET_STORE_ARN
const DB_CLUSTER_INSTANCE_ARN = process.env.DB_CLUSTER_INSTANCE_ARN

class AuroraDB {
  static get limit() {
    return 1000
  }
  static createParams(sql) {
    return {
      resourceArn: DB_CLUSTER_INSTANCE_ARN,
      secretArn: AWS_SECRET_STORE_ARN,
      sql
    }
  }

  static executeStatement(params, error = new Error) {
    return rds.executeStatement(params)
      .promise()
      .catch((err) => {
        error.message = err.message
        throw error
      })
  }

  static createAccountsTable() {
    const params = this.createParams(tableCreation.accounts)
    return this.executeStatement(params, new Error)
  }

  static createAccountActivationsTable() {
    const params = this.createParams(tableCreation.accountActivations)
    return this.executeStatement(params, new Error)
  }

  static createTokensTable() {
    const params = this.createParams(tableCreation.tokens)
    return this.executeStatement(params, new Error)
  }

  static createBrowserPlansTable() {
    const params = this.createParams(tableCreation.browserPlans)
    return this.executeStatement(params, new Error)
  }

  static deleteTable(name = '') {
    const sql = `DROP TABLE IF EXISTS ${name}`
    const params = this.createParams(sql)
    return this.executeStatement(params, new Error)
  }
}

module.exports = { AuroraDB }
