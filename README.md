# Bly - Flux app framework with hapi like interface [![Build Status](https://travis-ci.org/JaapRood/bly.svg?branch=master)](https://travis-ci.org/JaapRood/bly)

Bly is a tiny framework to help you write web apps using a [Flux architecture](http://facebook.github.io/flux/docs/overview.html). It's designed to give help you structure and organise your code in anyway that works for your app. Simple enough to work on small prototypes, elegant enough to work on bigger projects too [citation needed](http://en.wikipedia.org/wiki/Wikipedia:Citation_needed). It's designed to empower you and then get out of your way. 

**Stability: experimental**. So the claims above might not yet be met, be ready for bugs and be careful using it in production.


## Browser support
[![browser support](https://ci.testling.com/JaapRood/blys.png)](https://ci.testling.com/JaapRood/bly)

## At a glance

Simple app interface

- Create an app using `new Bly.App()`
- Define what stores are available to the rest of the app using `app.stores` (we'll let you decide how to implement them)
- Register handlers for actions using `app.action` (again, letting you decide how to implement stores)
- Render your app by passing a function to `app.render` (called every time after an action was dispatched)
- Start your app using `app.start` (from now on actions can be injected)
- Inject an action `app.inject`

Plugins for code organisation

- Register plugins using `app.register`
- Define plugins with a register function with the signature `plugin, options, next`
- Use the plugin interface to access `plugin.action`, `plugin.stores`, etc.
- Nest plugins in plugins using `plugin.register`
- Report results to the `render` function using `plugin.results`

## Quick example

```js

var app = new Bly.App();

// register store
var pageStore = yourPageStore();

app.stores('pages', pageStore);

// handle actions
app.action({
	name: 'navigate',
	handler: function(waitFor, payload) {
		pageStore.navigate(payload);
	}
});

// render your app
app.render(function() {
	React.renderComponent({
		App({
			bly: app
		});
	})	
});

// start your app
app.start();

```

# Background

**Making it easier to create great UI's and app experiences for the end user, and keeping it that way through the course of the project**. That's the most important thing; if I can't imagine how something would actually benefit the end user I probably won't put it in. This doesn't mean that these benefits can sometimes be quite indirect. For example, if something just greatly simplifies the developing experience on my side, that'll make it easier for me to be creative, try different things, pay attention to details, feel happy about my project. All of which I believe in the end contribute to the quality of the final product.

Especially the **keeping it that way** is important, as that's where I see a lot of approaches go down the drain. If in any way possible I highly favour approaches that will make my codebase grow linearly relative to the complexity of the app. There are plenty of frameworks / architectures out there that are very clean and easy to start off with, but as soon as you step outside the bounds of it, doing anything becomes very complex. It should be relatively easily to get started, but more importantly, it should be easy to keep going.

# Using with React

Bly and [React](http://reactjs.org) make for a really good couple, it's what Bly was designed with in mind. 

The [bly-react-mixin](https://github.com/JaapRood/bly-react-mixin) module is the glue to their relationship, letting you access stores and dispatch actions from your React components.

The rendering on every dispatched action really comes into it's own when used with immutable stores. Combining state defined with something like [immutable-js](https://github.com/facebook/immutable-js) with a simple shouldComponentUpdate implementation can make for efficient rendering of Bly apps.

# Examples

Bly is still pretty experimental and not used in many places yet. The best example is [an experimental repo](https://github.com/JaapRood/flux-experiments-chat) in which the idea and first code of Bly was developed, which is a port of Facebook's chat example. It also features stores written with [immutable-js](https://github.com/facebook/immutable-js) and rendering with [[React](http://reactjs.org).

Built anything? Add it here and send a pull request!

# API

## App interface

### var app = new App()

Create a new Bly App, of which generally one should exist. If you find yourself passing the app object around alot, consider using plugins to organise your code instead.

```js
var Bly = require('bly');
var app = new Bly.App();
```

### var ref = app.action(options)

Adds an action handler where:

- `options` - the action options object.

Returns a reference (string) to which to identify this handler with.

#### Action options

- `name` - (required) the name of the action, the identifying string. For example `RECEIVE_MESSAGES`. Can already be used before to register other handlers.
- `handler` - (required) a function with the signature `function (waitFor, payload)` used to generate the state mutations in stores. 
	- `waitFor` - a function passed to a handler which allows it to wait for other handlers using their reference. This is **synchronous**:
		```js
			function(waitFor, payload) {
				// do something

				waitFor('otherHandler');

				// continue doing things
			}
		```
	- `payload` - an object that represents the payload of the action.
- `ref` - an optional reference for this particular handler, which other handlers can use to `waitFor` this handler. Defaults to be randomly generated.

```js
app.action({
	name: 'RECEIVE_MESSAGES',
	handler: function(waitFor, payload) {
		waitFor('other-handler');

		// do things
	}
});

app.action({
	name: 'RECEIVE_MESSAGES',
	ref: 'other-handler'
	handler: function(waitFor, payload) {
		// do other things
	}
});
```

### var refs = app.action(actions)

Same as `var ref = app.action(options)` but where `actions` is an array of Action options. Returns an array of references to the handlers registered.

### app.inject(action, payload)

Inject an action into the system to be dispatched. The dispatching of an action is *synchronous* and only one action can be dispatched at a time. App has to be started with `app.start` before actions can be injected.

- `action` - (required) the name of the action you want to inject. For example `RECEIVE_MESSAGES`.
- `payload` - the payload of the action, can be any value. Defaults to an empty object `{}`

```js
var app = new Bly.App();

app.action({
	name: 'RECEIVE_MESSAGES',
	handler: myActionHandler
});

app.start();

app.inject('RECEIVE_MESSAGES');

```

#### Injected action lifecycle

Each injected action goes through a pre-defined life cycle constrained by the ideas of a Flux architecture.

- `onPreDispatch` event emitted.
- action dispatched to handlers registered with `app.action` or `plugin.action`.
- results gathered from any functions registered with `app.results` or `plugin.results`.
- render functions registered with `app.render` called with the gathered results.
- `onPostDispatch` event emitted with the gathered results.

### app.plugins

Object where each key is a plugin name and the value are the exposed properties by that plugin using `plugin.expose()`.

### app.register(plugins, [options,] callback)

Register one or more plugins.

- `plugins` - (required) a plugin object or array of plugin objects, either manually constructed or plugin module.
- `options` - optional options for registering, used by **Bly** to register the plugin and not passed to the plugin. Currently there are no options available, but reserved for future use.
- `callback` - (required) function with signature `function(err)` to be called once plugins have registered or failed to do so. **Failure to register should be considered an unrecoverable event**.

#### Register plugin object

To register a plugin this object is (or array of objects are) required containing the following:

- `pluginName` or `name` - (required) name of the plugin, which must be unique. If using a module, using the name of the package is a pretty solid way to ensure it is doesn't conflict with others. `pluginName` can be used if the plugin object is a function to prevent conflicts with `Function.name`.
- `multiple` - a boolean that indicates whether a plugin can be registered more than once. For safety defaults to `false`.
- `register` - (required) a function with signature `function(plugin, options, next)` that is responsible for registering the plugin

#### Passing options to plugin's register function

To pass options to the plugin's register function, wrap the plugin object into an object containing:

- `plugin` - (required) plugin object
- `options` - object of options to be passed to the **plugin**


### app.results(resultFn)

Register a function with signature `function(report)` that allow for values to be passed to `app.render` functions. Proven to be especially useful for rendering individual sections of apps in plugins, which can then be stitched together during the actual rendering of the app.

- `resultFn` - function with signature `function(report)` where:
	`report` - function with signature `function(key, value)` used to expose results using a where:
		`key` - (required) string by which made accessible on `results` object
		`value` - value to be exposed on `results object`


### app.render(renderFunction)

Register a function that is to be called with the results of each dispatched actions, which is most useful for rendering your views to reflect the possible state changes made by the stores. If the app was started before registering the render function the render function will be called once straight away.

- `renderFunction` - (required) function with signature `function(results)` where:
	- `results` - object with results generated by functions registered with `app.results`

### app.start()

Start the app. For now this basically means actions can from then on be injected, in order to make sure all plugins and stores had a chance to set themselves up in working order. Would also be the point where in the future we can add more safety regarding the correct configuration of an app, like validating that stores are only listening for actions that the system knows off.


### var store = app.stores(storeName)

Retrieve a reference to a store instance

- `storeName` - name of the store to retrieve the instance for.

### var stores = app.stores()

Retrieve a reference to the the global stores object, which contains all stores instance indexed by storeName.

### app.stores(storeName, instance)

Register a store instance to be available to the rest of the app.

- `storeName` - (required) name of the store it can be referenced by.
- `instance` - (required) value which represents your store instance.


### app.stores(storeMap [, options])

Set an entire object of store instances at once, indexed by store names.

- `storeMap` - (required) object of store instances, indexed by store names.
- `options` - object of options containing any of the following:
	- `merge` - whether to merge the store map with the existing register of stores instead of completely replacing it. Defaults to `true`.


## Plugin interface

Plugins, inspired by [Hapi's plugins](http://hapijs.com/api#plugin-interface) provide a way to organise your application's business logic, as well as extend apps with general purpose utilities (allthough many of the hooks for the latter still have to be discovered / determined). At the present it mostly enables you to think of your app as composition of various logical units, each covering their own domains, instead of one monolothic app.

A plugin consists of:

- `name` - (required) the plugin name used as an unique key to identify the plugin. When publishing plugins on npm it's a good idea to use their package name as name of the plugin in order to prevent conflicts.
- `register` - (required) single entry point into the plugin's functionality. This is where a plugin declares what it should be doing.
- `multiple` - a boolean that indicates whether a plugin can be registered more than once. For safety defaults to `false`.

Example of a plugin implementing a very simple store.

```js

exports.name = 'messages';

exports.register = function(plugin, options, next) {
	var messages = [];

	plugin.action({
		name: 'RECEIVE_MESSAGE',
		handler: function(waitFor, message) {
			messages.push(message);
		}
	});

	plugin.stores('messages', messages);

	next();
}

```

### register(plugin, options, next)

Register the plugin where:

- `plugin` - the registration interface to the app.
- `options` - options object passed in `app.register`.
- `next` - function with signature `function(err)` which should be called once registration of the plugin is complete. While this allows for asynchronous registration it also means that if `next` is never called, the app will not configure itself properly. Any errors passed *should be considered unrecoverable events* and *should trigger application termination*.

### plugin.bly

A reference to the `Bly` module used to create the app, so the plugin doesn't need to have `Bly` as a dependency itself.

### plugin.version

The version the `Bly` module used.

### plugin.action(options)

Adds a handler for an action as described by `app.action`

### plugin.after(afterFunction)

Adds a function to be called after the app was started.

- `afterFunction` - (required) function which will be executed after the app starts (no arguments passed)

### plugin.expose(key, value)

Exposes a property to the `app.plugins[pluginName]` object.

- `key` - (required) the key for which to expose the value
- `value`

### plugin.inject(action, payload)

Inject an action into the app to be dispatched as described by `app.inject`.

### plugin.register(plugins, [options ,], callback)

Register plugins with this app as described by `app.register`.

### plugin.render(renderFn)

Register a function that is to be called with the results of each dispatched actions. As described by `app.render`.

### plugin.results(resultsFn)

Register a function with signature `function(report)` that allow for values to be passed to `app.render` functions. As described by `app.results`.

### plugin.stores(...)

Interface to setting and getting store as described by `app.stores`.