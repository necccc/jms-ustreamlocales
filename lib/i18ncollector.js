var Transform = require('stream').Transform;
var util      = require('util');

var localeUnitRegxp = /_t_\([\'|\"]([a-z0-9_\.\-]*)[\'|\"],?\)?/gi;
var I18nFetcher     = require('./i18nfetcher');


function findLabels (moduleData) {

	var module = moduleData.module;
	var match = moduleData.source.match(localeUnitRegxp);
	var ulmsunits = [];

	if (match) {
		var ulmsunits = match.map(function (item) {
			var k = item.match(/_t_\([\'|\"]([a-z0-9_\.\-]*)[\'|\"],?\)?/i)

			if (k && k[1]) {
				return k[1];
			}
		})
	}

	moduleData.i18n = ulmsunits;

	return moduleData;
}

function I18nCollector () {
	Transform.apply(this, arguments);
	this.pause();

	I18nFetcher(this);
}

util.inherits(I18nCollector, Transform);

I18nCollector.prototype._transform = function (chunk, encoding, done) {
	var data = findLabels(JSON.parse(chunk.toString()));
	this.push(JSON.stringify(data));
	done();
}

module.exports = I18nCollector;