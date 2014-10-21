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
			stores: stores
		});
	})	
});

// start your app
app.start();

```

# Background

**Making it easier to create great UI's and app experiences for the end user, and keeping it that way through the course of the project**. That's the most important thing; if I can't imagine how something would actually benefit the end user I probably won't put it in. This doesn't mean that these benefits can sometimes be quite indirect. For example, if something just greatly simplifies the developing experience on my side, that'll make it easier for me to be creative, try different things, pay attention to details, feel happy about my project. All of which I believe in the end contribute to the quality of the final product.

Especially the **keeping it that way** is important, as that's where I see a lot of approaches go down the drain. If in any way possible I highly favour approaches that will make my codebase grow linearly relative to the complexity of the app. There are plenty of frameworks / architectures out there that are very clean and easy to start off with, but as soon as you step outside the bounds of it, doing anything becomes very complex. It should be relatively easily to get started, but more importantly, it should be easy to keep going.

# API reference

Working on this.. pull request anyone?
