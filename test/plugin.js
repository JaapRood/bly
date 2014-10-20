var test = require('tape');
var App = require('../lib/app');
var _ = require('lodash');
var Joi = require('joi');

var emptyFn = function() {};

test('App - plugin interface', function(t) {
	t.plan(1);

	var app = new App();

	var pluginSchema = Joi.object().keys({
		bly: Joi.object(),
		version: Joi.string().regex(/^(\d+\.\d+\.\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/i),
		
		// methods
		action: Joi.func(),
		expose: Joi.func(),
		inject: Joi.func(),
		register: Joi.func(),
		render: Joi.func(),
		stores: Joi.func()
	});

	var dinnerPlugin = {
		name: 'dinner',

		register: function(plugin, options, next) {
			t.doesNotThrow(function() {
				Joi.assert(plugin, pluginSchema);
			}, 'Plugin interface has the expected schema');
		}
	}

	app.register(dinnerPlugin, emptyFn);

});

test('Plugin#expose', function(t) {
	t.plan(5);

	var app = new App();

	var dinnerPlugin = {
		name: 'dinner',

		register: function(plugin, options, next) {

			t.throws(function() {
				plugin.expose();
			}, 'key must be specified');

			t.doesNotThrow(function() {
				plugin.expose('eat');
				plugin.expose('drink', 'it-all');
			});

			next();
		}
	};

	app.register(dinnerPlugin, function(err) {

		t.equals(typeof app.plugins.dinner, 'object', 'Dinner plugin must be available on app.plugins');
		t.equals(typeof app.plugins.dinner.eat, 'undefined', 'No value passed means undefined key');
		t.equals(app.plugins.dinner.drink, 'it-all', 'Exposed values are available under app.plugins[name][key]');

	});
});