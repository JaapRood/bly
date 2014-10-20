var test = require('tape');
var App = require('../lib/app');
var _ = require('lodash');

var emptyFn = function() {};
var emptyRegisterFn = function(plugin, options, next) { next(); }

test('App#register - registers plugin', function(t) {
	t.plan(5);

	var app = new App();

	var dinnerPlugin = {
		name: 'dinner',

		register: function(plugin, options, next) {
			t.equals(typeof plugin, 'object', 'Register receives plugin interface');
			t.equals(typeof options, 'object', 'Register receives plugin options');
			t.equals(typeof next, 'function', 'Register receives callback');

			next();
		}
	};

	t.doesNotThrow(function() {
		app.register(dinnerPlugin, function(err) {
			t.error(err, 'No errors passed when registering successful');
		});
	}, 'Plugins can be registered');
});

test('App#register - callback for registering is required', function(t) {
	t.plan(1);

	var app = new App();

	var plugin = {
		name: 'dinner',
		register: emptyRegisterFn
	};

	t.throws(function() {
		app.register(plugin);
	}, 'Callback is required when registering plugins');
});

test('App#register - plugin definitions', function(t) {
	t.plan(3);

	var app = new App();

	t.throws(function() {
		app.register(null, emptyFn);
	}, 'Plugin definition should be an object');

	t.throws(function() {

		app.register({
			name: 'dinner'
		}, emptyFn);

	}, 'Plugin definition requires register function');	

	t.throws(function() {
		app.register({
			register: emptyRegisterFn
		}, emptyFn);
	}, 'Plugin definition requires name');
});

test('App#register - passing options to plugin register function', function(t) {
	t.plan(2);

	var app = new App();


	var pluginOptions = {
		courses: 5
	};

	var dinnerPlugin = {
		name: 'dinner',
		register: function(plugin, options, next) {

			t.deepEqual(options, pluginOptions, 'Options to register function should arrive left untouched');

			next();
		}
	};

	t.doesNotThrow(function() {
		app.register({
			plugin: dinnerPlugin,
			options: pluginOptions
		}, emptyFn);
	}, "Can register with object containing plugin definition and options");
});

test('App#register - registering same plugin multiple times', function(t) {
	t.plan(3);

	var app = new App();
	var dinnerPlugin = {
		name: 'dinner',
		register: emptyRegisterFn
	};

	var snacksPlugin = {
		name: 'lunch',
		register: emptyRegisterFn,
		multiple: true
	};

	var otherDinnerPlugin = {
		name: 'dinner',
		register: emptyRegisterFn,
		multiple: true
	};


	app.register(dinnerPlugin, emptyFn);

	t.throws(function() {	
		app.register(dinnerPlugin, emptyFn);
	}, 'By defaut you cannot register the same plugin twice (indexed by name)');

	t.doesNotThrow(function() {
		app.register(snacksPlugin, emptyFn);
		app.register(snacksPlugin, emptyFn);
		
	}, 'You can when you opt in with `multiple` flag');

	t.throws(function() {

		app.register(otherDinnerPlugin, emptyFn);

	}, 'Both registered as new plugin must allow multiple');
});

test('App#register - failing registration', function(t) {
	t.plan(1);

	var app = new App();

	var failingPlugin = {
		name: 'will-fail-to-register',
		register: function(plugin, options, next) {
			next(new Error('it hit the fan'));
		}
	};

	app.register(failingPlugin, function(err) {
		t.ok(err, 'Errors passed down from plugins that failed to register');
	});

});

test('App#register - registering multiple plugins at a time', function(t) {
	t.plan(4);

	var app = new App();

	var dinnerPlugin = {
		name: 'dinner',
		register: emptyRegisterFn
	};

	var lunchPluginCalled = 0;
	var lunchPlugin = {
		name: 'lunch',
		register: function(plugin, optinos, next) {
			lunchPluginCalled++;
			next();
		}
	};

	var pluginWithOptions = {
		plugin: {
			name: 'pizza-party',
			register: emptyRegisterFn
		},
		options: {
			cheese: true,
			toppings: ['pepperoni', 'mozarella']
		}
	};

	var failingPlugin = {
		name: 'will-fail-to-register',
		register: function(plugin, options, next) {
			next(new Error('it hit the fan'));
		}
	};

	t.doesNotThrow(function() {
		app.register([dinnerPlugin, pluginWithOptions], function(err) {
			t.error(err, 'No errors should be passed down on successful registering');
		});

		app.register([failingPlugin, lunchPlugin], function(err) {
			t.ok(err, 'Error should be passed and be considered as an unrecoverable event');
			t.equals(lunchPluginCalled, 0, "Registering of plugins is halted after one failing (plugins already registered will NOT be cleaned up)");
		});

	}, "Array of plugin definitions can be used to register multiple plugins in series");
});

test('App#register - plugins can register plugins', function(t) {
	t.plan(1);

	var app = new App();

	var dinnerPlugin = {
		name: 'dinner',
		register: emptyRegisterFn
	};

	var mealsPlugin = {
		name: 'meals',
		register: function(plugin, options, next) {

			t.doesNotThrow(function() {
				plugin.register(dinnerPlugin, next);
			});
		}
	}

	app.register(mealsPlugin, emptyFn);
});