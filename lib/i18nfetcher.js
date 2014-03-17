var request         = require('request');
var zlib            = require('zlib');

var log             = require('npmlog');
var ParseL10nLine   = require('./loader/parser');
var FilterL10nUnits = require('./loader/filter');
var SaveL10nUnits   = require('./loader/save');


var redisClient     = require('./redis-client');

var translationDataUrl = 'http://static.ustream.tv/localisation/translations_data_%DATE%.json';
var translationPackageUrl = 'http://static.ustream.tv/localisation/translations_%LOCALE%_%DATE%.php.gz';


var updatedLocales = [];


function pad (v) {
	return ('0'+v).split('').reverse().splice(0,2).reverse().join('');
}

function getUrlWithDate (urltemplate, date) {
	return urltemplate.replace('%DATE%', [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-'));
}

function getUrlWithLocale (urltemplate, locale) {
	return urltemplate.replace('%LOCALE%', locale);
}



module.exports = function (deployProcess) {


	function checkLocaleDeploys (localeDates) {
		redisClient.get('lastUpdateTimes', function (err, data) {
			if (err) {
				throw err;
			}

			if (data == null) {
				redisClient.set('lastUpdateTimes', JSON.stringify(localeDates));
				for (var locale in localeDates) {
					if (locale !== 'all') {
						updatedLocales.push(locale);
						fetch(locale, new Date(localeDates['all']));
					}
				}
			} else {

				data = JSON.parse(data)

				// TODO
				for (var locale in data) {
					if (locale !== 'all') {
						if (new Date(localeDates[locale]) > new Date(data[locale])) {
							updatedLocales.push(locale);
							fetch(locale, new Date(localeDates['all']));
						}
					}
				}
				if (updatedLocales.length < 1) {
					deployProcess.resume();
				}
				redisClient.set('lastUpdateTimes', JSON.stringify(localeDates));
			}
		});
	}

	function fetch (locale, date) {

		var url = getUrlWithDate(translationPackageUrl, date);
		url = getUrlWithLocale(url, locale);

		log.info('ustream-locale', 'fetch ' + locale + ' ' + date + ': ' + url);

		request(url)
			.pipe(zlib.createGunzip())
			.on('error', function (err) {
				updatedLocales.shift();
				log.warn('ustream-locale', locale + ' not found, skipping');
			})
			.pipe(new ParseL10nLine({ objectMode: true }))
			.pipe(new FilterL10nUnits({ objectMode: true }))
			.pipe(new SaveL10nUnits({ objectMode: true }, locale))
			.on('end', function () {
				finished(locale);
			});

	}

	function finished (locale) {
		log.info('ustream-locale',locale + ' done');

		updatedLocales.shift();

		if (updatedLocales.length < 1) {
			deployProcess.resume();
		}
	}


	request(
		getUrlWithDate(translationDataUrl, new Date()),
		function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var data = JSON.parse(body);
				if (data.lastUpdateTimes) {
					checkLocaleDeploys(data.lastUpdateTimes)
				}
			}
		}
	);


}