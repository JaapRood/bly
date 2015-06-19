var test = require('tape');
var App = require('../lib/app');

var emptyFn = function() {};



test('App#inject', function(t) {
	t.plan(5);

	var app = new App();
	var action = 'EAT';

	app.action({ name: action, handler: function(waitFor, payload) {
		t.equals(arguments.length, 2, "invoke handler with 2 arguments");
		t.equals(typeof waitFor, 'function', "waitFor function as 1st arg")	;
		t.equals(typeof payload, 'object', "payload object as 2nd arg");
	}});

	t.throws(function() {
		app.inject(action);
	}, "App has to be started before actions can be injected");

	app.start();

	t.doesNotThrow(function() {
		app.inject(action);
	});
});

test('App#inject - accepts object with name and payload instead of string', function(t) {
	t.plan(4);

	var app = new App();
	var action = 'EAT';
	var actionPayload = { type: 'food' };

	app.action({
		name: action,
		handler: function(waitFor, payload) {
			t.deepEquals(payload, actionPayload, 'Payload is passed on');
		}
	});

	app.start();

	t.throws(function() {
		app.inject({});
	}, 'Object passed to inject must contain name of action');

	t.throws(function() {
		app.inject({
			name: {}
		});
	}, 'Name of action must be a string');

	t.doesNotThrow(function() {
		app.inject({
			name: action,
			payload: actionPayload
		});
	}, 'Accepts an object with the name of action as a prop');
});

test('App#inject - one action at a time', function(t) {
	t.plan(1);

	var app = new App();
	var action = 'EAT';

	app.action({ name: action, handler: function(waitFor, payload) {
		t.throws(function() {
			app.inject('DRINK');
		}, "Can't inject another action while handling one");
	}});

	app.start();

	app.inject(action);
});

test('App#inject - let one handler wait for the other', function(t) {
	t.plan(4);

	var app = new App();
	var action = 'EAT';
	var calledHandlers = [];

	var handlerOne = app.action({
		name: action,
		handler: function(waitFor, payload) {
			t.doesNotThrow(function() {
				waitFor(handlerTwo);
			}, 'Handlers can wait on other handlers, synchronously');

			calledHandlers.push(handlerOne);
		}
	})

	var handlerTwo = app.action({
		name: action,
		handler: function(waitFor, payload) {
			calledHandlers.push(handlerTwo);
		}
	});

	app.start();
	app.inject(action);

	t.equals(calledHandlers.length, 2, 'Both handlers should be called');
	t.equals(calledHandlers[0], handlerTwo, 'Handler one should have waited for handler two');
	t.equals(calledHandlers[1], handlerOne, 'Handler one should have waited for handler two');
});

test('App#inject - detect circular dependencies between handlers', function(t) {
	t.plan(1);

	var action = 'EAT';
	var app = new App();

	var handlerOne = app.action({
		name: action, 
		handler: function(waitFor, payload) {
			waitFor(handlerTwo);
		}
	});

	var handlerTwo = app.action({
		name: action, 
		handler: function(waitfor, payload) {
			t.throws(function() {
				waitFor(handlerOne);
			}, "Can't have to handlers waiting on each other");
		}
	});

	app.start();
	app.inject(action);
});

test('App#inject - only waiting for existing handlers', function(t) {
	t.plan(1);

	var action = 'EAT';
	var app = new App();

	var handlerOne = app.action({
		name: action, 
		handler: function(waitFor, payload) {
			t.throws(function() {
				waitFor('does-not-exist');
			}, "Can't wait for handlers that aren't registered");
		}
	});

	app.start();
	app.inject(action);
});