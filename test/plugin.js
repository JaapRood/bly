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
		action: Joi.func(),
		render: Joi.func(),
		inject: Joi.func(),
		register: Joi.func()
	});

	var plugin = {
		name: 'dinner',

		register: function(plugin, options, next) {
			console.log(plugin);

			t.doesNotThrow(function() {
				Joi.assert(plugin, pluginSchema);
			}, 'Plugin interface has the expected schema');
		}
	}

	app.register(plugin, emptyFn);

});