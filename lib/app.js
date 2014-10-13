var Hoek = require('hoek');
var Events = require('events');
var Dispatcher = require('./dispatcher');
var _ = require('lodash');
var util = require('util');

var internals = {};

exports = module.exports = internals.App = function() {
	Hoek.assert(this.constructor === internals.App, 'App must be instantiated using new');

	// we're an event emitter
	Events.EventEmitter.call(this);

	this._dispatcher = new Dispatcher();
	this._started = false;
};

util.inherits(internals.App, Events.EventEmitter);

internals.App.prototype.action = function(configs) {
	Hoek.assert(configs, 'Action config must exist');
	Hoek.assert(typeof configs === 'object', 'Action configuration must be an object or an array');

	configs = _.isArray(configs) ? configs : [configs];

	var dispatcher = this._dispatcher;
	var refs = _.map(configs, function registerAction(config) {
		Hoek.assert(config.handler, 'Missing handler for action configuration:', config);
		Hoek.assert(config.name, 'Missing name for action configuration:', config);

		var handler = config.handler;
		var action = config.name;
		var handlerName = config.ref;

		return dispatcher.register(action, handler, handlerName);
	});

	return refs.length > 1 ? refs : refs.pop();
};


internals.App.prototype.render = function(renderFn) {
	return this.on('onPostDispatch', renderFn);
};

internals.App.prototype.start = function() {
	if (this._started) return;

	this._started = true;

	return this;
};

internals.App.prototype.inject = function(action, payload) {
	Hoek.assert(this._started, "Actions can't be injected until the app is started"); // maybe queue until start?
	Hoek.assert(action, "Action is required to dispatch an action");

	payload = payload || {};

	this.emit('onPreDispatch');

	this._dispatcher.dispatch(action, payload);

	this.emit('onPostDispatch', this);

	return this;
};
