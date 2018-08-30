# StaticSearch

StaticSearch is object, It provide methods to client call to server to get data. The technology used is ajax.

**Platform**
- Jquery

**Using**

Import file StaticSearch.js to your html page. Then create new object and run it.

```
var search = new StaticSearch({
	url: "Default get from attribute action of form",
	method: "Default get from attribute method of form",
	dataType: "html",
	autoload: true,
	
	// Setting elements in your html page
	elements: {
		form: ".search-engine-form",
		pagination: ".search-engine-pagination a",
		record: ".search-engine-record a",
		success: ".search-engine-success",
		error: ".search-engine-error"
	},
	
	// Setting custom method
	methods: {
		render: {
			error: function(){},
			success: function(){}, 
		}
	},
	
	// Setting custom events
	events: {
		submit: function(){},
		loading: function(){},
		loaded: function(){},
		render: function(){}
	}
});
```

Then call run to apply to.

```
search.run();
```

OK, now it working!
