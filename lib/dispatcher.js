var Hoek = require('hoek'),
	_ = require('lodash');

var internals = {};

exports = module.exports = internals.Dispatcher = function Dispatcher() {
	this._handlersByAction = {};
	this._isPending = {};
	this._isHandled = {};
	this._isDispatching = false;
	this._pendingPayload = null;
	this._pendingAction = null;

	// bind some methods for convenience
	this.invokeHandler = this.invokeHandler.bind(this);
	this.waitFor = this.waitFor.bind(this);
};

internals.Dispatcher.prototype.register = function(action, handler, name) {
	Hoek.assert(_.isString(action), "Action to register handler for should be a string");
	Hoek.assert(_.isFunction(handler), "Handler should be a function");
	Hoek.assert(!name || _.isString(name), "Name for handler should be a string");
	
	name = name || internals.uniqueId();

	var handlersForAction = this._handlersByAction[action] || {};

	Hoek.assert(!handlersForAction[name], "Name '%s' already used for action '%s', has to be unique", name, action);

	handlersForAction[name] = handler;

	this._handlersByAction[action] = handlersForAction;

	return name;
};


internals.Dispatcher.prototype.unregister = function(action, handlerOrName, name) {
	Hoek.assert(action, 'To unregister a handler specify the action for which it was registered');

	var handlersForAction = this._handlersByAction[action] || {};

	if (!name) {
		Hoek.assert(_.isString(handlerOrName) || _.isFunction(handlerOrName), "To unregister handler specify either the handler function registered, or it's name");

		if (_.isString(handlerOrName)) {
			// name got passed
			name = handlerOrName;
		} else {
			// handler got passed
			name = internals.findKey(handlersForAction, handlerOrName);
			Hoek.assert(name, "Can't find handler registered for action '%s'", action);
		}
	}

	Hoek.assert(handlersForAction[name], "Can't find handler registered with name '%s' for action '%s", name, action);

	delete handlersForAction[name];
};

internals.Dispatcher.prototype.waitFor = function(names) {
	Hoek.assert(this.isDispatching(), "Can only wait for other handlers while dispatching");

	// accept both a single name or an array
	names = _.isString(names) ? [names] : names;

	var isPending = this._isPending;
	var isHandled = this._isHandled;
	var action = this._pendingAction;
	var handlersForAction = this._handlersByAction[action];
	var invokeHandler = this.invokeHandler;

	_.each(names, function(name) {
		if (isPending[name]) {
			Hoek.assert(isPending[name], "Circular dependency detected while waiting for '%s'", name);
			return;
		}

		var handler = handlersForAction[name];

		Hoek.assert(handler, "'%s' does not map to a registered handler for '%s'", name, action);

		invokeHandler(handler, name);
	});
};

internals.Dispatcher.prototype.dispatch = function(action, payload) {
	Hoek.assert(!this.isDispatching(), "Cannot dispatch in the middle of a dispatch");

	var handlersForAction = this._handlersByAction[action];
	Hoek.assert(handlersForAction && !_.isEmpty(handlersForAction), "No handlers registered for action '%s'", action);

	payload = payload || {};

	this.startDispatching(action, payload);

	var invokeHandler = this.invokeHandler,
		isPending = this._isPending;

	try {
		_.each(handlersForAction, function(handler, name) {
			if (isPending[name]) {
				return;
			}

			invokeHandler(handler, name);

		});
	} finally {
		this.stopDispatching();
	}
};

internals.Dispatcher.prototype.startDispatching = function(action, payload) {
	var isPending = this._isPending = {};
	var isHandled = this._isHandled = {};

	var actionHandlers = this._handlersByAction[action];

	_.each(actionHandlers, function(handler, name) {
		isPending[name] = false;
		isHandled[name] = false;
	});

	this._pendingAction = action;
	this._pendingPayload = payload;
	this._isDispatching = true;
};

internals.Dispatcher.prototype.stopDispatching = function() {
	this._pendingAction = null;
	this._pendingPayload = null;
	this._isDispatching = false;
};

internals.Dispatcher.prototype.isDispatching = function() {
	return this._isDispatching;
};

internals.Dispatcher.prototype.invokeHandler = function(handler, name) {
	this._isPending[name] = true;

	handler(this.waitFor, this._pendingPayload);
	this._isHandled[name] = true;
};

internals.uniqueId = (function() {
	var lastID = 1;

	return function(prefix) {
		prefix = prefix || 'ID_';
		return prefix + lastID ++;
	};
})();

internals.findKey = function(obj, value) {
	var key;

	_.some(obj, function(v, k) {
		if (v === value) {
			key = k;
			return true;
		}
	});

	return key;
}