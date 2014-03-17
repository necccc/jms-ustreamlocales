var Transform = require('stream').Transform;
var util      = require('util');


var FilterL10nUnits = function () {
	Transform.apply(this, arguments);
};

util.inherits(FilterL10nUnits, Transform);

FilterL10nUnits.prototype._transform = function (chunk, encoding, done) {

	var data = JSON.parse(chunk.toString());

	if (data) {

		if (data.key.slice(0,3) ==	'js.' ) {

			var ulmsData = {
				label: data.key,
				value: data.val
			}

			this.push(JSON.stringify(ulmsData));
		}
	}
			done();

};

module.exports = FilterL10nUnits;