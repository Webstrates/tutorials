Notebook Tutorial
=================

Creating simple, persistent Google Docs-like documents using Webstrates is dead-simple thanks to
`contentEditable`, but you should know this by now if you've checked out the first tutorial in the
series: [Collaborative Notes](//github.com/Webstrates/tutorials/tree/master/collaborative_notes).
If you haven't, you should do that first.

In this tutorial, we will create a notebook you can add multiple, named pages (documents), editable
through `contentEditable`. To allow multiple users to view different pages at the same time, each
page will be shown to the user through a `<transient>` tag.

After we get this working, we will add _tagging_. Tagging allows you to name a specific version of
a document, so you later can go back.

# 1. Getting started

Create a new document with three columns, one for the list of pages in our notebook, one to show
the actual document, and one to show tags.

```html
<html>
<head>
	<style>
	html, body {
		height: 100%;
	}
	body {
		margin: 0;
		background: #eee;
	}
	#flexContainer {
		height: 100%;
		display: flex;
		justify-content: space-between;
		align-items: stretch;
	}
	#docListContainer, #docContainer, #tagTableContainer {
		flex-direction: column;
		padding: 0 5px;
	}
	#docListContainer {
		width: 150px;
	}
	#tagTableContainer {
		max-width: 250px;
	}
	#docContainer {
		flex-grow: 1;
	}
	</style>
</head>
<body>
<div id="flexContainer">
	<div id="docListContainer">
		<h2>Documents</h2>
	</div>
	<div id="docContainer"></div>
	<div id="tagTableContainer">
		<h2>Tags</h2>
	</div>
</div>
</body>
</html>
```

# 2. Adding pages

To add a page, we need a text box and an add button, as well as a listener on the button. When the
button is pressed, we want to add the new page to the left column and open a new webstrate with
the page's name in the middle column. However, if we just add an iframe to the middle column, every
user of the notebook would have to look at the same document. To solve this, we can add the iframe
to a transient element instead.

```html
<html>
<head>
	<style>
	html, body {
		height: 100%;
	}
	body {
		margin: 0;
		background: #eee;
	}
	#flexContainer {
		height: 100%;
		display: flex;
		justify-content: space-between;
		align-items: stretch;
	}
	#docListContainer, #docContainer, #tagTableContainer {
		flex-direction: column;
		padding: 0 5px;
	}
	#docListContainer {
		width: 150px;
	}
	#tagTableContainer {
		max-width: 250px;
	}
	#docContainer {
		flex-grow: 1;
	}
	#docIframe {
		background: #fff;
		width: 100%;
		height: 100%;
		border: 0;
	}
	</style>
	<script>
	webstrate.on("loaded", function(webstrateId) {
		var docNameInput = document.getElementById("docNameInput");
		var docAddButton = document.getElementById("docAddButton");
		var docList = document.getElementById("docList");

		function showDocument(docName) {
			docIframe = document.createElement("iframe");
			docIframe.setAttribute("src", "/" + webstrateId + "-" + docName);
			docIframe.setAttribute("id", "docIframe");
			var docIframeTransient = document.createElement("transient");
			docIframeTransient.appendChild(docIframe);
			docContainer.innerHTML = "";
			docContainer.appendChild(docIframeTransient);
		}

		docAddButton.addEventListener("click", function() {
			if (!docNameInput.value) return;

			docList.insertAdjacentHTML("beforeend", `<li>${docNameInput.value}</li>`);
			showDocument(docNameInput.value);
			docNameInput.value = "";
		});
	});
	</script>
</head>
<body>
<div id="flexContainer">
	<div id="docListContainer">
		<h2>Documents</h2>
		<ol id="docList"></ol>
		<input id="docNameInput" type="text" placeholder="Name..."/>
		<button id="docAddButton">Add</button>
	</div>
	<div id="docContainer"></div>
	<div id="tagTableContainer">
		<h2>Tags</h2>
	</div>
</div>
</body>
</html>
```

Okay, try it out—add a page by entering a name and pressing the "Add" button. An iframe should now
pop up in the middle. Nothing happening? Remember to reload the page, so the JavaScript gets
reinterpreted.

Note that we are prefixing the document names with the current webstrate's name to prevent name
collisions. If your notebook is located at `/mynotebook` and you create a page named
`cooking-recipes`, the underlying page will reside at `/mynotebook-cooking-recipes`.

Now we could manually add the `contentEditable` attribute to the iframe and have an editable
document in there, but we still have no means of switching between pages in our notebook. Adding
that functionality, however, should be quite easy now, since we already have a `showDocument()`
function. Just add a click listener to the script:

```html
<script>
webstrate.on("loaded", function(webstrateId) {
	var docNameInput = document.getElementById("docNameInput");
	var docAddButton = document.getElementById("docAddButton");
	var docList = document.getElementById("docList");

	function showDocument(docName) {
		docIframe = document.createElement("iframe");
		docIframe.setAttribute("src",  "/" + webstrateId + "-" + docName);
		docIframe.setAttribute("id", "docIframe");
		var docIframeTransient = document.createElement("transient");
		docIframeTransient.appendChild(docIframe);
		docContainer.innerHTML = "";
		docContainer.appendChild(docIframeTransient);
	}

	docAddButton.addEventListener("click", function() {
		if (!docNameInput.value) return;

		docList.insertAdjacentHTML("beforeend", `<li>${docNameInput.value}</li>`);
		showDocument(docNameInput.value);
		docNameInput.value = "";
	});

	docList.addEventListener("click", function(ev) {
		if (ev.target.tagName.toLowerCase() !== "li") return;

		var docName = ev.target.innerText;
		showDocument(docName);
	});
});
</script>
```

Let's also update the styles slightly, to make it more obvious that the page titles on the left can
be clicked.

```css
#docList li, #tagTable td {
	cursor: pointer;
	color: #22a;
}
#docList li:hover, #tagTable tr:hover {
	background: #fff;
}
```

The `#tagTable` stuff doesn't matter right now, but we will need it later.

# 3. Fine-tuning pages

Clicking a document in the left side will now let you switch between notebooks, but we can hardly
see it happening, because all the pages are blank. Let's add a title to new pages and make them
editable when we add them:

```javascript
docAddButton.addEventListener("click", function() {
	if (!docNameInput.value) return;

	var docName = docNameInput.value;
	docList.insertAdjacentHTML("beforeend", `<li>${docName}</li>`);
	showDocument(docName);
	docIframe.webstrate.on("transcluded", function(iframeWebstrateId) {
		if (!docIframe.contentDocument.body.getAttribute("contenteditable")) {
			docIframe.contentDocument.body.innerHTML = `<h1>${docName}</h1>`;
			docIframe.contentDocument.body.setAttribute("contenteditable", "");
		}
	});
	docNameInput.value = "";
});
```

We have now updated the add button listener to add another event listener that gets triggered once
the iframe has been transcluded (loaded). When triggered, we add a title to the document and make
the content editable.

# 4. Showing tags

Our notebook is fairly functional by now, but we can do better.

>**Sidenote:** Webstrates saves a complete, fine-grained history of any changes that has ever
>happened to the document. A list of all the operations can be seen by navigating to
>`/<webstrateId>?ops`. We can even navigate between versions by restoring a document to a previous
>version using `/<webstrateId>?restore=<version>`. Websites have domain names, so we don't have to
>remember IP addresses. In the same sense, Webstrates has tags, so we don't have to remember version
>numbers. A tag is a text string associated with a version name. If you want to know, check out
>[Tagging](/Webstrates/Webstrates#tagging) and
>[Restoring a webstrate](/Webstrates/Webstrates#restoring-a-webstrate) in the documentation.

So let's add tagging support. When a document is shown, we should show a list of all tags on the
document. Just like the iframe, the tags should also be in a transient enclosure, so multiple users
viewing different pages won't interfere with each other's tag lists:

```html
<script type="text/javascript" charset="utf-8">
webstrate.on("loaded", function(webstrateId) {
	var docNameInput = document.getElementById("docNameInput");
	var docAddButton = document.getElementById("docAddButton");
	var docList = document.getElementById("docList");
	var docContainer = document.getElementById("docContainer");
	var docIframe;

	var tagTableContainer = document.getElementById("tagTableContainer");
	var tagTable = document.createElement("table");
	tagTable.setAttribute("id", "tagTable");
	var tagTableTransient = document.createElement("transient");
	tagTableTransient.appendChild(tagTable);
	tagTableContainer.appendChild(tagTableTransient);

	function showDocument(docName) {
		docIframe = document.createElement("iframe");
		docIframe.setAttribute("src",  "/" + webstrateId + "-" + docName);
		docIframe.setAttribute("id", "docIframe");
		var docIframeTransient = document.createElement("transient");
		docIframeTransient.appendChild(docIframe);
		docContainer.innerHTML = "";
		docContainer.appendChild(docIframeTransient);
		docIframe.webstrate.on("transcluded", function(iframeWebstrateId) {
			updateTags(docIframe.contentWindow.webstrate.tags());
			docIframe.contentWindow.webstrate.on("tag", function() {
				updateTags(docIframe.contentWindow.webstrate.tags());
			});
		});
	}

	function updateTags(tags) {
		tagTable.innerHTML = "";
		Object.keys(tags).forEach(function(version) {
			tagTable.insertAdjacentHTML("beforeend",
				`<tr><td>${version}</td><td>${tags[version]}</td></tr>`);
		})
	}

	docAddButton.addEventListener("click", function() {
		if (!docNameInput.value) return;

		var docName = docNameInput.value;
		docList.insertAdjacentHTML("beforeend", `<li>${docName}</li>`);
		showDocument(docName);
		docIframe.webstrate.on("transcluded", function(iframeWebstrateId) {
			if (!docIframe.contentDocument.body.getAttribute("contenteditable")) {
				docIframe.contentDocument.body.innerHTML = `<h1>${docName}</h1>`;
				docIframe.contentDocument.body.setAttribute("contenteditable", "");
			}
		});
		docNameInput.value = "";
	});

	docList.addEventListener("click", function(ev) {
		if (ev.target.tagName.toLowerCase() !== "li") return;

		var docName = ev.target.innerText;
		showDocument(docName);
	});
});
</script>
```

After reloading the page and clicking a page title, the page's tags should now be shown. Webstrates
has [auto-tagging](/Webstrates/Webstrates#auto-tagging), so there should already be one for when the
document was created. Let's clean it up a little:

```css
#tagTableContainer td:nth-child(2) {
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	float: left;
	width: 220px;
}
#tagTable {
	border-collapse: collapse;
}
#tagTable td:nth-child(1) {
	padding-right: 10px;
}
```

# 5. Adding tags

Let's make it possible to add more tags. We can do this by extending the `showDocument` function to
also add an input box and add button. We could just add this to the HTML and have it always show up,
but then it'd also show up even before we chose a page. We don't like that.

```javascript
function showDocument(docName) {
	docIframe = document.createElement("iframe");
	docIframe.setAttribute("src",  "/" + webstrateId + "-" + docName);
	docIframe.setAttribute("id", "docIframe");
	var docIframeTransient = document.createElement("transient");
	docIframeTransient.appendChild(docIframe);
	docContainer.innerHTML = "";
	docContainer.appendChild(docIframeTransient);
	docIframe.webstrate.on("transcluded", function(iframeWebstrateId) {
		updateTags(docIframe.contentWindow.webstrate.tags());
		docIframe.contentWindow.webstrate.on("tag", function() {
			updateTags(docIframe.contentWindow.webstrate.tags());
		});
	});

	if (!document.getElementById("tagNameInput")) {
		var tagNameInput = document.createElement("input");
		tagNameInput.setAttribute("type", "text");
		tagNameInput.setAttribute("placeholder", "Tag...");
		tagNameInput.setAttribute("id", "tagNameInput");
		tagTableTransient.appendChild(tagNameInput);

		var tagAddButton = document.createElement("button");
		tagAddButton.innerHTML = "Add";
		tagTableTransient.appendChild(tagAddButton);
		tagAddButton.addEventListener("click", function() {
			if (!tagNameInput.value) return;

			docIframe.contentWindow.webstrate.tag(tagNameInput.value);
			tagNameInput.value = "";
		});
	}
}
```

In the above, we have also added an event listener to create the tags by calling
`webstrate.tag(<tag>)` on the document's `window` property. Note that we are calling it on the
iframe's (i.e. the page's) window property, and not the notebook's window property.

Now all we need to do is make the tags clickable, so let's add another event listener for that that
restore the document:

```javascript
tagTable.addEventListener("click", function(ev) {
	if (!ev.target.closest("tr")) return;

	var version = parseInt(ev.target.closest("tr").children[0].innerText);
	docIframe.contentWindow.webstrate.restore(version);
});
```

**And we're done! Another application in just about 80 lines of JavaScript!**

>**Final Sidenote:** Clicking between versions causes new tags to pop up, and you may wonder why.
Restoring documents is non-destructive, meaning we don't remove anything from the history. When we
are at version _n_ and we revert to version _m_, we don't actually delete the operations between
version _n_ and _m_. Instead, we calculate the operations required to go back to version _m_ from
_n_ and apply them instead. That way, no data is ever lost by restoring documents.
