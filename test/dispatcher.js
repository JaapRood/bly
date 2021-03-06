var test = require('tape');
var Dispatcher = require('../lib/dispatcher');

var emptyFn = function() {};

test('Dispatcher#register - it throws when arguments for are missing', function(t) {
	t.plan(5);

	var dispatcher = new Dispatcher();

	t.throws(function() {
		dispatcher.register();
	}, "Action and handler are required");

	t.throws(function() {
		dispatcher.register(function() {});
	}, "Action should be a string");

	t.throws(function() {
		dispatcher.register('EAT');
	}, "Handler should be a function");

	t.throws(function() {
		dispatcher.register('EAT', emptyFn, 10);
	}, "When given a name, it should be a string");

	t.doesNotThrow(function() {
		dispatcher.register('EAT', emptyFn, 'handler-name');

	}, "Should not throw when all arguments correct");
});

test('Dispatcher#register - it throws in name conflicts', function(t) {
	t.plan(2);

	var action = 'EAT_HOTDOGS';

	t.throws(function() {
		var dispatcher = new Dispatcher();

		dispatcher.register(action, emptyFn, 'kerk');
		dispatcher.register(action, emptyFn, 'kerk');
	}, 'Handlers can\'t have same name for an action');

	t.doesNotThrow(function() {
		var dispatcher = new Dispatcher();

		dispatcher.register(action, emptyFn, 'kerk');
		dispatcher.register('EAT_BURGERS', emptyFn, 'kerk');
	}, "Handlers can have the same name if registered for different action");
});

test('Dispatcher#register - it should the name of the registered handler', function(t) {
	t.plan(2);

	var dispatcher = new Dispatcher();

	t.equals(typeof dispatcher.register('EAT', emptyFn), 'string');
	t.equals(dispatcher.register('EAT', emptyFn, 'burgers'), 'burgers');
});

test('Dispatcher#unregister', function(t) {
	t.plan(6);

	var action = 'EAT_TOFU',
		handler = emptyFn,
		name = 'tofu-handler',
		dispatcher,
		otherEmptyFn = function() {};

	var beforeEach = function() {
		dispatcher = new Dispatcher();
		dispatcher.register(action, handler, name);
	};

	t.throws(function() {
		beforeEach();

		dispatcher.unregister();
	}, 'Action is required');

	t.throws(function() {
		beforeEach();

		dispatcher.unregister(action);
	}, 'handler or name is required');

	t.throws(function() {
		beforeEach();

		dispatcher.unregister(action, otherEmptyFn);
	}, 'handler has to be registered for the action');

	t.doesNotThrow(function() {
		beforeEach();

		dispatcher.unregister(action, handler);
	}, 'unregister with action and handler');

	t.throws(function() {
		beforeEach();

		dispatcher.unregister(action, 'unregistered-handler');
	}, 'name has to be registered for the given action');

	t.doesNotThrow(function() {
		beforeEach();

		dispatcher.unregister(action, name);
	}, 'unregister with action and name');
});

test('Dispatcher#dispatch - invoke handler', function(t) {
	t.plan(3);

	var action = 'EAT';
	var dispatcher = new Dispatcher();

	dispatcher.register(action, function(waitFor, payload) {
		t.equals(arguments.length, 2, "invoke handler with 2 arguments");
		t.equals(typeof waitFor, 'function', "waitFor function as 1st arg")	;
		t.equals(typeof payload, 'object', "payload object as 2nd arg");
	});

	dispatcher.dispatch(action);
});

test('Dispatcher#dispatch - one action at the time', function(t) {
	t.plan(1);

	var action = 'EAT';
	var dispatcher = new Dispatcher();

	dispatcher.register(action, function(waitFor, payload) {
		t.throws(function() {
			dispatcher.dispatch(action);
		}, 'No dispatching of actions while already dispatching an action');
	});

	dispatcher.dispatch(action);
});

test('Dispatcher#waitFor - let one handler wait for the other', function(t) {
	t.plan(4);

	var action = 'EAT';
	var dispatcher = new Dispatcher();
	var calledHandlers = [];

	var handlerOne = dispatcher.register(action, function(waitFor, payload) {
		t.doesNotThrow(function() {
			waitFor(handlerTwo);
		}, 'Handlers can wait on other handlers');
		calledHandlers.push(handlerOne);
	});

	var handlerTwo = dispatcher.register(action, function(waitFor, payload) {
		calledHandlers.push(handlerTwo);
	});

	dispatcher.dispatch(action);

	t.equals(calledHandlers.length, 2, 'Both handlers should be called');
	t.equals(calledHandlers[0], handlerTwo, 'Handler one should have waited for handler two');
	t.equals(calledHandlers[1], handlerOne, 'Handler one should have waited for handler two');
});

test('Dispatcher#waitFor - detect circular dependancies between handlers', function(t) {
	t.plan(1);

	var action = 'EAT';
	var dispatcher = new Dispatcher();

	var handlerOne = dispatcher.register(action, function(waitFor, payload) {
		waitFor(handlerTwo);
	});

	var handlerTwo = dispatcher.register(action, function(waitfor, payload) {
		t.throws(function() {
			waitFor(handlerOne);
		}, "Can't have to handlers waiting on each other");
	});

	dispatcher.dispatch(action);
});

test('Dispatcher#waitFor - only waiting for existing handlers', function(t) {
	t.plan(1);

	var action = 'EAT';
	var dispatcher = new Dispatcher();

	var handlerOne = dispatcher.register(action, function(waitFor, payload) {
		t.throws(function() {
			waitFor('does-not-exist');
		}, "Can't wait for handlers that aren't registered");
	});

	dispatcher.dispatch(action);
});

test('Dispatcher#isDispatching', function(t) {
	t.plan(3);

	var action = 'EAT';
	var dispatcher = new Dispatcher();

	dispatcher.register(action, function(waitFor, payload) {
		t.ok(dispatcher.isDispatching(), 'Dispatching in handlers');
	});

	t.ok(!dispatcher.isDispatching(), 'Not dispatching until we do');
	dispatcher.dispatch(action);
	t.ok(!dispatcher.isDispatching(), 'Dispatching is synchronous');
});