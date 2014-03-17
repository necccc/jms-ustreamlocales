var Transform   = require('stream').Transform;
var util        = require('util');
var redisClient = require('./redis-client');
var _              = require('lodash');

var localeUnitRegxp = /_t_\([\'|\"]([a-z0-9_\.\-]*)[\'|\"],?\)?/gi;


function I18nInjector () {
	Transform.apply(this, arguments);
}

util.inherits(I18nInjector, Transform);


I18nInjector.prototype._transform = function (chunk, encoding, done) {

	var data = JSON.parse(chunk);

	if (!data.request) {
		this.push(chunk); // no changes
		done();
		return;
	}

	//moduleData.i18n = ulmsunits;

	var locale = data.request.locale;
	var unitsLength = _.flatten(_.pluck(data.modules, 'i18n')).length;

	if (unitsLength < 1) {
		this.push(chunk); // no changes
		done();
		return;
	}


	var that = this;

	data.modules.forEach(function (module) {

		var units = module.i18n.length;

		if (units < 1) {
			return;
		}

		var ulmsUnits = [];

		ulmsUnits.push('' +
			'if(!window.ustream){' +
			'	window.ustream={}' +
			'}' +
			'ustream = window.ustream;' +
			'if(!ustream.labels){' +
			'	ustream.labels={}' +
			'}' +
			'(function(l){'
		);

		module.i18n.forEach(function (unit, i) {

			redisClient.get([locale, unit].join(':'), function (err, ulmsData) {
				if (err || ulmsData == null) {
					ulmsUnits.push('l["' + unit + '"]="' + unit.toUpperCase() + '";');
				} else {
					ulmsUnits.push('l["' + unit + '"]="' + ulmsData + '";');
				}

				if (i == units - 1) {
					ulmsUnits.push('})(ustream.labels);');
					module.source = ulmsUnits.join('') + module.source;
				}

				unitsLength -= 1;

				if (unitsLength < 1) {
					that.push(JSON.stringify(data));
					done();
				}
			});
		});
	});


}

module.exports = I18nInjector;