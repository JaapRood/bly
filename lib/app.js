var invariant = require('./invariant');
var Events = require('events');
var Dispatcher = require('./dispatcher');
var _ = require('lodash');
var util = require('util');
var async = require('async');

var internals = {};

exports = module.exports = internals.App = function() {
	invariant(this.constructor === internals.App, 'App must be instantiated using new');

	// we're an event emitter
	Events.EventEmitter.call(this);

	this._dispatcher = new Dispatcher();
	this._started = false;

	this._registrations = {}; // name -> plugin
	this.plugins = {}; // run time state exposed by plugins using plugin.expose()

	this._stores = {};
};

util.inherits(internals.App, Events.EventEmitter);

internals.App.prototype.action = function(configs) {
	invariant(configs, 'Action config must exist');
	invariant(typeof configs === 'object', 'Action configuration must be an object or an array');

	configs = _.isArray(configs) ? configs : [configs];

	var dispatcher = this._dispatcher;
	var refs = _.map(configs, function registerAction(config) {
		invariant(config.handler, 'Missing handler for action configuration:', config);
		invariant(config.name, 'Missing name for action configuration:', config);

		var handler = config.handler;
		var action = config.name;
		var handlerName = config.ref;

		return dispatcher.register(action, handler, handlerName);
	});

	return refs.length > 1 ? refs : refs.pop();
};


internals.App.prototype.render = function(renderFn) {
	invariant(_.isFunction(renderFn), 'A function is required to automatically trigger rendering after dispatching actions');

	// register
	this.on('onPostDispatch', renderFn);

	// call straight away if we have already started
	if (this._started) {
		renderFn();
	}
};

internals.App.prototype.start = function() {
	if (this._started) return;

	this._started = true;

	return this;
};

internals.App.prototype.inject = function(action, payload) {
	invariant(this._started, "Actions can't be injected until the app is started"); // maybe queue until start?
	invariant(action, "Action is required to dispatch an action");

	payload = payload || {};

	this.emit('onPreDispatch');

	this._dispatcher.dispatch(action, payload);

	this.emit('onPostDispatch', this);

	return this;
};

internals.App.prototype.stores = function(name, store, options) {
	if (arguments.length === 0) {
		return this._stores;
	} else if (arguments.length === 1 && _.isString(name)) {
		return this._stores[name];
	}

	// we must be setting something
	var attrs;
	
	invariant(typeof name === 'object' || _.isString(name), 'To set a store pass either a name and the store instance, or an object of name -> store combinations');

	if (typeof name === 'object') {
		attrs = name;
		options = store;
	} else {
		attrs = {};
		attrs[name] = store;
	}

	options = _.extend({ merge: true }, options || {}); // no options yet, but reserving to keep API consistent

	if (options.merge) {
		_.extend(this._stores, attrs);
	} else {
		this._stores = attrs;
	}
};

internals.App.prototype.register = function(plugins /*, [options], callback */) {
	var optionsPassed = typeof arguments[1] === 'object';

	var options = optionsPassed ? arguments[1] : {};
	var callback = optionsPassed ? arguments[2] : arguments[1];

	invariant(_.isFunction(callback), 'A callback function is required to register a plugin');

	return this._register(plugins, options, callback);
}

internals.App.prototype._register = function(plugins, options, callback) {
	var app = this;

	plugins = [].concat(plugins);
	var registrations = _.map(plugins, function(plugin, index) {
		
		var hint = plugins.length > 1 ? '(' + index + ')' : ''; // hint to which plugin is causing trouble for debugging

		invariant(typeof plugin === 'object', 'Invalid plugin object %s', hint);
		invariant(!!plugin.register ^ !!plugin.plugin, "Either 'plugin' or 'register' is required, cannot include both %s", hint);
		invariant(
			_.isFunction(plugin.register) || 
			(plugin.plugin && _.isFunction(plugin.plugin.register)), 
			"Plugin register must be a function or a required plugin module %s", hint);
		invariant(plugin.name || (plugin.plugin && plugin.plugin.name), 'Plugin needs a name %s', hint);

		var register = plugin.register || plugin.plugin.register;
		var name = plugin.name || plugin.plugin.name;
		
		invariant(name, "Missing plugin name %s", hint);

		return {
			register: register,
			name: name,
			multiple: plugin.multiple || false,
			options: plugin.options
		};
	});

	async.each(registrations, function(item, next) {
		app._plugin(item, options, next);
	}, callback);
};

internals.App.prototype._plugin = function(plugin, registerOptions, callback) {
	var app = this;

	invariant(typeof plugin === 'object', 'Plugin definition required to register plugin');
	invariant(plugin.name, 'A plugin must have name');

	var existingPlugin = app._registrations[plugin.name];
	invariant(!existingPlugin || (existingPlugin.multiple && plugin.multiple), "Plugin %s already registered. To allow, define plugin.multiple", plugin.name);
	
	// Right now the interface doesn't do much special than forwarding the app's methods and 
	// leaving out the ability to start the app. But this gives us oppurtinity to better control
	// how plugins will work in the future in a (hopefully) less invasive way.
	var root = {};

	root.bly = require('../');
	root.version = root.bly.version;

	root.action = function(configs) {
		return app.action.call(app, configs);
	};

	root.expose = function(key, value) {
		invariant(key, 'Specify key to which expose the value for');

		app.plugins[plugin.name] = app.plugins[plugin.name] || {};
		app.plugins[plugin.name][key] = value;
	};

	root.inject = function(action, payload) {
		return app.inject.call(app, action, payload);
	};
	
	root.register = function(plugins /* [options], callback */) {
		return app.register.call();
	};

	root.render = function(renderFn) {
		return app.action.call(app, renderFn);
	};

	root.stores = function() {
		return app.stores.apply(app, arguments);
	};

	app._registrations[plugin.name] = plugin;

	plugin.register.call(null, root, plugin.options || {}, callback);
};
