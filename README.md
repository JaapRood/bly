# Bly - Flux app framework with hapi like interface [![Build Status](https://travis-ci.org/JaapRood/bly.svg?branch=master)](https://travis-ci.org/JaapRood/bly)

Bly is a tiny framework to help you write web apps using a [Flux architecture](http://facebook.github.io/flux/docs/overview.html). It's designed to give help you structure and organise your code in anyway that works for your app. Simple enough to work on small prototypes, elegant enough to work on bigger projects too [citation needed](http://en.wikipedia.org/wiki/Wikipedia:Citation_needed). It's designed to empower you and then get out of your way. 

**Stability: experimental**. So the claims above might not yet be met, be ready for bugs and be careful using it in production.

# Browser support
[![browser support](https://ci.testling.com/JaapRood/blys.png)](https://ci.testling.com/JaapRood/bly)

# Example

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

```


