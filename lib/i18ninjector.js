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


	//moduleData.i18n = ulmsunits;

	var locale = chunk.request.locale;


	var unitsLength = _.flatten(_.pluck(chunk.modules, 'i18n')).length;

	if (unitsLength < 1) {
		this.push(chunk);
		done();
		return;
	}


	var that = this;

	chunk.modules.forEach(function (module) {

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

			redisClient.get([locale, unit].join(':'), function (err, data) {
				if (err || data == null) {
					ulmsUnits.push('l["' + unit + '"]="' + unit.toUpperCase() + '";');
				} else {
					ulmsUnits.push('l["' + unit + '"]="' + data + '";');
				}

				if (i == units - 1) {
					ulmsUnits.push('})(ustream.labels);');
					module.source = ulmsUnits.join('') + module.source;
				}

				unitsLength -= 1;

				if (unitsLength < 1) {
					that.push(chunk);
					done();
				}
			});
		});
	});


}

module.exports = I18nInjector;