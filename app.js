var Hoek = require('hoek');
var Events = require('events');
var Dispatcher = require('flux').Dispatcher;
var _ = require('lodash');

var internals = {};

exports = module.exports = internals.App = function() {
	Hoek.assert(this.constructor === internals.App, 'App must be instantiated using new');

	this.dispatcher = new Dispatcher();
};


internals.App.prototype.action = function(configs) {

	Hoek.assert(configs, 'Action config must exist');
	Hoek.assert(typeof configs === 'object', 'Action configuration must be an object or an array');

	configs = _.isArray(configs) ? configs : [configs];

	var dispatcher = this.dispatcher;
	var tokens = _.map(configs, function registerAction(config) {
		Hoek.assert(config.handler, 'Missing handler for action configuration:', config);
		Hoek.assert(config.name, 'Missing name for actio configuration:', config);

		var handler = config.handler;
		var name = config.name;

		dispatcher.register(config.handler);
	});

	if (tokens.length === 1) {
		return tokens.pop();
	} else {
		return tokens;
	}
};

internals.App.prototype.render = function() {};

internals.App.prototype.start = function() {};
