var redis           = require('redis');
var log             = require('npmlog');

var client = redis.createClient(
	6379,
	'127.0.0.1', {
		parser: 'javascript'
	});

client.select(1)

client.on('error', function (err) {
	log.info('redis', 'error');
	throw err;
});

client.on('ready', function () {
	log.info('redis', 'ready');
});

client.on('connect', function () {
	log.info('redis', 'connect')
});

module.exports = client;