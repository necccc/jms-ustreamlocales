var redis     = require('redis');
var Writable  = require('stream').Writable;
var util      = require('util');
var log       = require('npmlog');


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



function SaveL10nUnits (options, locale) {
	Writable.call(this, options);

	this.locale = locale;

	this.once('finish', function () {
		this.emit('end')
	}.bind(this))
}

util.inherits(SaveL10nUnits, Writable);

SaveL10nUnits.prototype._write = function (chunk, encoding, done) {

	var data = JSON.parse(chunk.toString());


	client.set(this.locale + ':' + data.label, data.value);


	done();
}

module.exports = SaveL10nUnits;