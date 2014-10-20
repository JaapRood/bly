var test = require('tape');
var App = require('../lib/app');
var _ = require('lodash');

var emptyFn = function() {};

test('App#results - can register result functions', function(t) {
	t.plan(3);

	var app = new App();

	t.doesNotThrow(function() {
		app.results(function(report) {
			t.ok(_.isFunction(report), 'results function gets passed a report function');
		});
	}, 'accepts functions');

	t.throws(function() {
		app.results();
	}, 'throws at something else than a function');


	app.action({
		name: 'test',
		handler: emptyFn
	});

	app.start();
	app.inject('test');
});

test('App#results - reports make it to render', function(t) {
	t.plan(6);

	var app = new App();

	app.results(function(report) {
		t.throws(function() {
			report();
		}, 'throws when key and value are missing');

		t.throws(function() {
			report(0);
		}, 'strings as keys only');

		t.doesNotThrow(function() {
			report('strings', 'yup');
			report('numbers', 5);
			report('objects', { hell: 'yeah'});
			report('functions', emptyFn);
		}, 'results can be reported');
	});


	app.render(function(results) {
		t.equals(typeof results, 'object', 'results are passed to render functions');

		t.ok(_.every(['strings', 'numbers', 'objects', 'functions'], function(prop) {
			return !!results[prop];
		}), 'all data made it');

		t.equals(results.strings, 'yup', 'yes, all data made it');
	});

	app.action({
		name: 'test',
		handler: emptyFn
	});

	app.start();
	app.inject('test');
});

test('App#results - results get to render when render defined later', function(t) {
	t.plan(2);

	var app = new App();

	app.results(function(report) {
		report('je', 'weetzelf');
	});

	app.action({
		name: 'test',
		handler: emptyFn
	});

	app.start();
	app.inject('test');

	app.render(function(results) {
		t.equals(typeof results, 'object', 'results object passed to later defined render method');

		t.equals(results.je, 'weetzelf');
	});
});