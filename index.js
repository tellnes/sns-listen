'use strict'

const http = require('http')
const https = require('https')
const inherits = require('util').inherits
const EventEmitter = require('events')
const jsonBodyParser = require('body-parser').json
const MessageValidator = require('sns-validator')

module.exports = SNSListen

const CONFIRM_SUBSCRIPTION = Symbol()

inherits(SNSListen, EventEmitter)
function SNSListen(options, listener) {
  if (!(this instanceof SNSListen)) return new SNSListen(options, listener)
  EventEmitter.call(this)

  options = options || {}
  this.log = options.log

  if (listener)
    this.on('notification', listener)
}

const jsonOptions =
  { limit: '300kb'
  , strict: true
  , type() { return true }
  }
const readAndParseJsonBody = jsonBodyParser(jsonOptions)

const validator = new MessageValidator()
SNSListen.prototype.middleware = function() {
  return (req, res) => {
    if (this.log) this.log.trace('sns incoming request')

    if (req.method !== 'POST') {
      if (this.log) this.log.info({ method: req.method }, 'method not POST')
      return
    }

    if (req.headers['x-amz-sns-rawdelivery'] === 'true') {
      this.emit('error'
        , new Error('SNSError: Raw delivery is not implemented')
        )
      return
    }

    readAndParseJsonBody(req, res, (err) => {
      res.end()

      if (err) return this.emit('error', err)
      validator.validate(req.body, (err, message) => {
        if (err) return this.emit('error', err)

        if (this.log) this.log.trace({ message }, 'sns incoming message')

        switch (message.Type) {
        default:
          {
            const err = new Error('Unknown message type; ' + message.type)
            err.message = message
            this.emit('error', err)
          }
          break

        case 'SubscriptionConfirmation':
          this[CONFIRM_SUBSCRIPTION](message)
          break

        case 'Notification':
          this.emit('notification', message)
          break

        case 'UnsubscribeConfirmation':
          this.emit('unsubscribed', message)
          break
        }
      })
    })
  }
}

SNSListen.prototype[CONFIRM_SUBSCRIPTION] = function(message) {
  const req = https.get(message.SubscribeURL)
  req.on('error', (err) => this.emit('error', err))
  req.on('response', (res) => {
    if (res.statusCode !== 200) {
      this.emit('error'
        , new Error('Unexpected status code when confirming subscription')
        )
      return
    }

    this.emit('subscribed', message, res)
  })
}

SNSListen.prototype.listen = function() {
  const server = http.createServer(this.middleware())
  server.listen(...arguments)
  return server
}
