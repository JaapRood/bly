var test = require('tape');
var App = require('../lib/app');
var _ = require('lodash');

var emptyFn = function() {};

test("App#render", function(t) {
	t.plan(4);

	var app = new App();

	var unsubscribe;

	t.doesNotThrow(function() {
		unsubscribe = app.render(function() {
			t.pass('Is called after dispatch');
		});

		t.ok(_.isFunction(unsubscribe), 'returns an unsubscribe function');
	}, 'accepts function');
	

	app.action({
		name: 'test',
		handler: emptyFn
	});

	app.start();

	app.inject('test');

	t.doesNotThrow(function() {
		unsubscribe();
	}, 'unsubscribe function takes no arguments and prevents any further callbacks to render function');

	app.inject('test');

});
