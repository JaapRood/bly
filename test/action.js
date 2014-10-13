var test = require('tape');
var App = require('../lib/app');
var _ = require('lodash');

var emptyFn = function() {};

var app;
function newApp() {
	app = new App();
};

test('App#action', function(t) {
	newApp();

	t.plan(6);

	t.throws(function() {
		app.action();
	}, 'throws when not passing anything');

	t.throws(function() {
		app.action('not gonna work');
	}, 'throws when not passing an object or array of objects');


	t.doesNotThrow(function() {
		app.action({
			name: 'EAT',
			handler: emptyFn
		});
	}, 'registers handler with name and handler');

	t.doesNotThrow(function() {
		app.action([
			{
				name: 'EAT',
				handler: emptyFn
			},
			{
				name: 'DRINK',
				handler: emptyFn
			}
		]);
	}, 'accepts an array of config objects');

	t.throws(function() {
		app.action({
			name: 'EAT'
		});
	}, 'a handler is required');

	t.throws(function() {
		app.action({
			handler: emptyFn
		});
	}, 'an action name is required');
});

test('App#action - handler refs', function(t) {
	t.plan(4);

	newApp();

	var action = 'EAT',
		ref;

	ref = app.action({name: action, handler: emptyFn});
	t.equals(typeof ref, 'string', 'Ref is returned as a string');

	t.doesNotThrow(function() {
		ref = app.action({name: action, handler: emptyFn, ref: 'given-name'})
		t.equals(ref, 'given-name', "Configured ref is used");
	}, "Ref can be provided");


	ref = app.action([
		{name: action, handler: emptyFn},
		{name: action, handler: emptyFn}
	]);

	t.ok(_.isArray(ref), "Returning an array of refs when calling with an array of actions");

});

test('App#action - handler refs - conflicts', function(t) {

	t.plan(2);

	newApp();

	app.action({
		name: 'EAT',
		handler: emptyFn,
		ref: 'name-will-conflict'
	});

	t.throws(function() {
		app.action({
			name: 'EAT',
			handler: emptyFn,
			ref: 'name-will-conflict'
		});
	}, 'Handlers can\'t have the same reference');

	t.doesNotThrow(function() {
		app.action({
			name: 'DRINK',
			handler: emptyFn,
			ref: 'name-will-conflict'
		});
	}, "Refs only have to be unique per action");
});