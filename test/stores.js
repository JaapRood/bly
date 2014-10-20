var test = require('tape');
var App = require('../lib/app');
var _ = require('lodash');

var emptyFn = function() {};

test('App#stores - sets and gets store instances', function(t) {
	t.plan(3);

	var app = new App();
	var mealsStore = { meals: ['dinner', 'lunch'] };

	t.doesNotThrow(function() {
		app.stores('meals', mealsStore);
	}, 'store can be set by name');

	t.doesNotThrow(function() {
		var store = app.stores('meals');

		t.deepEquals(store, mealsStore, 'retrieved store should be the same instance as one set');

	}, 'store can be retrieved by name');

});

test('App#stores - set multiple stores by passing object', function(t) {
	t.plan(3);

	var app = new App();

	var storesMap = {};
	storesMap['meals'] = { meals: ['dinner', 'lunch'] };
	storesMap['drinks'] = { drinks: ['beers', 'cocktails'] };

	t.doesNotThrow(function() {
		app.stores(storesMap);
	}, 'you can set multiple stores at once by using a name -> store map');

	t.doesNotThrow(function() {
		var store = app.stores('meals');

		t.deepEquals(store, storesMap.meals, 'store was set');
	});
});

test('App#stores - can replace existing stores map instead of merge', function(t) {
	t.plan(3);

	var app = new App();

	var foodMap = {};
	foodMap['meals'] = { meals: ['dinner', 'lunch'] };
	foodMap['drinks'] = { drinks: ['beers', 'cocktails'] };

	var dinnerMap = {};
	dinnerMap['courses'] = { meals: ['main', 'dessert'] };
	dinnerMap['wines'] = { drinks: ['red', 'white'] };	

	app.stores(foodMap);

	t.doesNotThrow(function() {

		app.stores(dinnerMap, { merge: false });

		t.notOk(app.stores('meals'), 'replaced stores should be no longer set');
		t.equals(app.stores('courses'), dinnerMap.courses, 'new stores should be accessable');

	}, 'can pass marge: false option');

});

test('App#stores - to set a store, it requires either a map or string -> store combo', function(t) {
	t.plan(2);

	var app = new App();

	t.throws(function() {
		app.stores(10);
	}, 'no numbers allowed');

	t.throws(function() {
		app.stores(emptyFn);
	}, 'no functions allowed');
});