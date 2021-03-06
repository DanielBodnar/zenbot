module.exports = {
  // required
  mongo_uri: 'mongodb://localhost:27017/zenbot',
  mongo_username: null,
  mongo_password: null,

  // optional GDAX API keys, for --trade flag
  gdax_passphrase: '',
  gdax_key: '',
  gdax_secret: '',

  // optional, for --tweet flag:
  twitter_key: '',
  twitter_secret: '',
  twitter_access_token: '',
  twitter_access_token_secret: ''
}