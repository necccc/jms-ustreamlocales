var I18nCollector   = require('./lib/i18ncollector');
var I18nInjector    = require('./lib/i18ninjector');


module.exports = {
	deploy: I18nCollector,
	server: I18nInjector
}