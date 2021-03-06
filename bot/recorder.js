var n = require('numeral')
  , constants = require('../conf/constants.json')
  , tb = require('timebucket')
  , zerofill = require('zero-fill')

module.exports = function container (get, set, clear) {
  var get_time = get('utils.get_time')
  function mountRecorder () {
    var get_time = get('utils.get_time')
    var client = get('utils.client')
    var bot = get('bot')
    var max_trade_id = 0
    if (bot.tweet) {
      var twitter_client = get('utils.twitter_client')
      function onTweet (err, data, response) {
        if (err) return get('console').error('tweet err', err)
        if (response.statusCode === 200 && data && data.id_str) {
          get('console').info('tweeted: '.cyan + data.text.white)
        }
        else get('console').error('tweet err', response.statusCode, data)
      }
    }
    function fetchTrades () {
      client.getProductTrades(max_trade_id ? {before: max_trade_id} : {}, function (err, resp, trades) {
        if (err) {
          get('console').error('getProductTrades err', err)
          return
        }
        if (!trades || !trades.length) {
          return
        }
        var orig_max_trade_id = max_trade_id
        var trades = trades.map(function (trade) {
          max_trade_id = Math.max(max_trade_id, trade.trade_id)
          return {
            id: String(trade.trade_id),
            time: new Date(trade.time).getTime(),
            size: n(trade.size).value(),
            price: n(trade.price).value(),
            side: trade.side
          }
        }).reverse()
        if (max_trade_id === orig_max_trade_id) {
          return
        }
        var ticks = {}
        trades.forEach(function (trade) {
          var tickId = tb(trade.time)
            .resize(constants.tick_size)
            .toString()
          ticks[tickId] || (ticks[tickId] = [])
          ticks[tickId].push(trade)
        })
        Object.keys(ticks).forEach(function (tickId) {
          var tick = get('db.ticks').create(ticks[tickId])
          if (tick) {
            get('console').info(tick.trade_ticker)
            if (bot.tweet && tick.vol > 20) {
              var tweet = {
                status: 'big trade alert:\n\naction: ' + tick.side + '\nvolume: ' + n(tick.vol).format('0.000') + '\nprice: ' + tick.price + '\ntime: ' + get_time(tick.time) + '\n\n #btc #gdax'
              }
              twitter_client.post('statuses/update', tweet, onTweet)
            }
          }
        })
        get('console').info('saw ' + trades.length + ' trades.')
      })
    }
    fetchTrades()
    var interval = setInterval(fetchTrades, constants.tick_ms)
  }
  mountRecorder()
  return null
}