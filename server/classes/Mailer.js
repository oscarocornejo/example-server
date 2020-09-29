const fs = require('fs')
const { resolve } = require('path')
const { SESV2 } = require('aws-sdk')

const ses = new SESV2()
const activationEmailTemplate = fs.readFileSync(
  resolve(__dirname, '..', 'constants/html/emailTemplate.html'),
  'utf8'
)

const domainName = process.env.DOMAIN_NAME
const url = process.env.NODE_ENV === 'production'
  ? `${process.env.DOMAIN_NAME}/api/activation`
  : 'http://localhost:3000/api/activation'
const fromEmail = process.env.ACTIVATION_FROM_EMAIL

class Mailer {
  static createParams({
    html,
    subject,
    toEmail,
    fromEmail,
    feedbackEmail,
    replyToEmail
  } = {}) {
    return {
      Content: {
        Simple: {
          Body: {
            Html: {
              Data: html,
              Charset: 'utf-8'
            }
          },
          Subject: {
            Data: subject,
            Charset: 'utf-8'
          }
        }
      },
      Destination: {
        ToAddresses: [toEmail]
      },
      FeedbackForwardingEmailAddress: feedbackEmail,
      FromEmailAddress: fromEmail,
      ReplyToAddresses: [replyToEmail]
    }
  }

  static sendEmail({
    html,
    subject,
    toEmail,
    fromEmail,
    feedbackEmail,
    replyToEmail
  } = {}) {
    const params = this.createParams({
      html,
      subject,
      toEmail,
      fromEmail,
      feedbackEmail,
      replyToEmail
    })
    return ses.sendEmail(params).promise()
  }

  static sendActivationEmail({
    toEmail,
    activationHash = '',
    name
  } = {}) {
    return this.sendEmail({
      html: activationEmailTemplate
        .replace('ACTIVATION_LINK', `${url}/${activationHash}`)
        .replace('USER_NAME', name)
        .replace('LOGO', `${domainName}/white.png`),
      subject: 'Crane | Activation Required',
      toEmail,
      fromEmail,
      feedbackEmail: fromEmail,
      replyToEmail: fromEmail
    })
  }
}

module.exports = { Mailer }
