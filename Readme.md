# Amazon AWS SNS endpoint

[![Version npm](https://img.shields.io/npm/v/sns-listen.svg?style=flat-square)](https://www.npmjs.com/package/sns-listen)[![npm Downloads](https://img.shields.io/npm/dm/sns-listen.svg?style=flat-square)](https://www.npmjs.com/package/sns-listen)[![Dependencies](https://img.shields.io/david/tellnes/sns-listen.svg?style=flat-square)](https://david-dm.org/tellnes/sns-listen)[![Tips](http://img.shields.io/gratipay/tellnes.png?style=flat-square)](https://gratipay.com/~tellnes/)


`sns-listen` handles incoming messages from AWS SNS
(Simple Notification Service).
It will automaticly confirms subscriptions and emit notifications.


## Example

```js
const snsListen = require('sns-listen')

const sns = snsListen()

sns.on('notification', (message) => {
  console.log('got notification', message)
})

sns.on('subscribed', () => {
  console.log('We are now subscribed')
})

sns.on('unsubscribed', () => {
  console.log('Got UnsubscribeConfirmation')
})

sns.on('error', (err) => {
  console.error('Something went wrong', err)
  process.exit()
})

sns.listen(9000)
```


## Use with Express

```js
const express = require('express')
const snsListen = require('sns-listen')

const app = express()

app.post('/sns', snsListen((message) => {
  console.log('got notification', message)
}).middleware());

app.listen(9000)
```


## Install

```bash
npm install -S sns-listen
```


## License

MIT
