const config = require('config')

const accountsTableName = config.get('accounts.tableName')
const tokensTableName = config.get('tokens.tableName')
const browserPlansTableName = config.get('plans.browser.tableName')
const accountActivationTableName = config.get('accountsActivation.tableName')

const accounts = `
  CREATE TABLE ${accountsTableName} (
    id                      TEXT UNIQUE,
    name                    TEXT,
    email                   TEXT UNIQUE,
    password                TEXT,
    account_paid            BOOLEAN DEFAULT FALSE,
    active                  BOOLEAN DEFAULT FALSE,
    max_concurrency         SMALLINT,
    plan_id                 SMALLINT,
    stripe_customer_id      TEXT UNIQUE,

    PRIMARY KEY (id, account_paid),
    FOREIGN KEY (plan_id, max_concurrency)
      REFERENCES ${browserPlansTableName} (id, max_concurrency) ON UPDATE CASCADE
  );
`

const tokens = `
  CREATE TABLE ${tokensTableName} (
    id              SERIAL,
    token           TEXT UNIQUE,
    account_id      TEXT,
    account_paid    BOOLEAN,
    active          BOOLEAN,
    max_concurrency SMALLINT,
    PRIMARY KEY (id, token),
    FOREIGN KEY (account_id, account_paid) REFERENCES ${accountsTableName} (id, account_paid) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (max_concurrency) REFERENCES ${browserPlansTableName} (max_concurrency) ON DELETE CASCADE ON UPDATE CASCADE
  );
`

const browserPlans = `
  CREATE TABLE ${browserPlansTableName} (
    id                   SERIAL,
    stripe_plan_id       TEXT UNIQUE,
    name                 TEXT,
    max_concurrency      SMALLINT UNIQUE,
    pricing              DECIMAL,
    PRIMARY KEY (id, max_concurrency)
  );
`

const accountActivations = `
  CREATE TABLE ${accountActivationTableName} (
    id                   SERIAL,
    activation_hash      TEXT UNIQUE,
    account_id           TEXT UNIQUE,
    PRIMARY KEY (id, activation_hash),
    FOREIGN KEY (account_id) REFERENCES ${accountsTableName} (id) ON UPDATE CASCADE
  );
`

module.exports = { accounts, accountActivations, tokens, browserPlans }
