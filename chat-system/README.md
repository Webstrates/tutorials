Chat System Tutorial
====================

First, you should create a new Webstrate, so we can get started.

# 1. Basic chat

A chat system needs a chat window, an input field, and a submit button. Let's add that to the body
of our Webstrate:

```html
<html>
<head>
</head>
<body>
<div id="chatWindow">

</div>
<input type="text" id="inputField" />
<button id="submitButton">Submit</button>
</body>
</html>
```

Luckily, whatever is written in the input field is not synchronized between browsers, because the
DOM does not reflect the changes.

We now want whatever written in the input field to be added to the chat window when the submit
button gets pressed. For that, we need to a script in the head element:

```html
<script>
webstrate.on("loaded", function(webstrateId, clientId, user) {
	var chatWindow = document.getElementById("chatWindow");
	var inputField = document.getElementById("inputField");
	var submitButton = document.getElementById("submitButton");

	submitButton.addEventListener("click", function() {
		chatWindow.insertAdjacentHTML('beforeend',
			'<div class="chatEntry">' + inputField.value + '</div>\n');
		inputField.value = "";
	});
});
</script>
```

> **Sidenote:** You might rightfully wonder why we are using something as obscure as
> `insertAdjacentHTML` instead of just appending to `innerHTML`. Changing `innerHTML` causes the
> entire body of the parent to be removed and reinserted. This would not only be a lot of
> unnecessary work for a system that transmits all changes made directly to the server, and
> indirectly to all connected clients, but it will also break message order later on when we start
> using the [`<transient>`](//github.com/Webstrates/Webstrates#transient-data) tag.
>
> While it's necessary to do with Webstrates, it's also good practice to do in general, as it will be
> a lot more performant than fiddling with `innerHTML`.

To test it out, reload the page, write something in the input field and press the submit button. The
page needs to be reloaded, because the JavaScript isn't reinterpreted until the page gets reloaded.
Imagine what a mess that would be if every little change caused the entire script to run again.

# 2. Adding meta information

Great! Now we have a rudimentary chat system, but we can't see who's writing what or when. We can
ask for the user's name using a `prompt`, and also add a timestamp to each message. By now, the
script should look something like this:

```html
<script>
webstrate.on("loaded", function(webstrateId, clientId, user) {
	var userName = prompt("Enter name:", "Anonymous");
	var chatWindow = document.getElementById("chatWindow");
	var inputField = document.getElementById("inputField");
	var submitButton = document.getElementById("submitButton");

	submitButton.addEventListener("click", function() {
		var timestamp = new Date().toISOString().substr(11,8);
		chatWindow.insertAdjacentHTML('beforeend', '<div class="chatEntry">' +
			'<span class="timestamp">[' + timestamp + ']</span> ' +
			'<span class="username">' + userName + '</span>: ' +
			'<span class="message">' + inputField.value + '</span>' +
		'</div>\n');
		inputField.value = "";
	});
});
</script>
```

Only the DOM state is synchronized, not the JavaScript state, so the `userName` variable will be
different across browsers.

It's time to add a little bit of style:

```html
<style>
body {
	font: 85% helvtica, sans-serif;
}
#chatWindow {
	width: 100%;
	border-bottom: 1px solid #eee;
}
#chatWindow .chatEntry {
	p"ad"ding: 2px;
}
#chatWindow .chatEntry .timestamp {
	font-size: 80%;
	color: #999;
}
#chatWindow .chatEntry .username {
	display: inline-block;
	width: 100px;
	text-align: right;
	font-weight: bold;
}
</style>
```

# 3. Private messaging

If we want to add private messaging, we will have to rely on some other Webstrate mechanics. If
private messages were just added to the DOM as well, they wouldn't be very private.

Instead, we will send messages using [signaling](//github.com/Webstrates/Webstrates#signaling)
and show them using transient elements. Signaling allows users to send messages on DOM elements
to (a subset of) all users.

Transient elements are DOM elements that are not being persisted, and thus are private to the
individual users.

To send a message to a client, we need to know that user's clientId. If we attach
the clientId to every message in the chat window, we can then easily map user names to clientIDs.

```html
<script>
webstrate.on("loaded", function(webstrateId, clientId, user) {
	var userName = prompt("Enter name:", "Anonymous");
	var chatWindow = document.getElementById("chatWindow");
	var recipientBox = document.createElement("transient");
	recipientBox.setAttribute("id", "recipientBox");
	var inputField = document.getElementById("inputField");
	var submitButton = document.getElementById("submitButton");

	document.body.insertBefore(recipientBox, inputField);

	submitButton.addEventListener("click", function() {
		var recipientId = recipientBox.getAttribute("clientid");
		var recipient = recipientBox.innerText;
		var timestamp = new Date().toISOString().substr(11,8);

		if (recipientId) {
			chatWindow.webstrate.signal({ userName: userName, text: inputField.value }, [recipientId]);
		} else {
			chatWindow.insertAdjacentHTML('beforeend', '<div class="chatEntry" ' +
				'title="clientId: ' + clientId + '" clientid="' + clientId + '">' +
				'<span class="timestamp">' + timestamp + '</span> ' +
				'<span class="username">' + userName + '</span>: ' +
				'<span class="message">' + inputField.value + '</span>' +
			'</div>\n');
		}
		inputField.value = "";
	});

	chatWindow.addEventListener("dblclick", function(e) {
		if (e.target.className === "username") {
			recipientBox.setAttribute("clientid", e.target.parentElement.getAttribute("clientid"));
			recipientBox.innerText = e.target.parentElement.querySelector(".username").innerText;
		} else {
			recipientBox.removeAttribute("clientid");
			recipientBox.innerText = "";
		}
	});

	chatWindow.webstrate.on("signal", function(message, senderId, node) {
		console.log(senderId, message);
	});
});
</script>
```

Quite a few things have happened in the above script:

1. We have added a `<transient>` element to contain the recipient's user name and clientId (`recipientBox`).
2. We have updated the messages to contain the clientIds.
3. We have added a double-click listener, so whenever a user name in the chat window is
double-clicked, the recipient box (the new `<transient>` element) gets updated with that user's
information. If anywhere else is double-clicked, the recipient box is cleared, so all future
messages are sent to the public chat.
4. We have updated the submit button listener to now send private messages using signaling on the
chat window, if a recipientId is defined (i.e. the clientid is defined on the recipient box).
5. And lastly, we have added a signaling listener that writes out the messages received on the cha
window to the console.

Try opening up 3 windows, write a few messages, double-click on one of the senders, write another
messages, and notice how that message only shows up in the console of the recipient.

Note that any messages written before we added clientIds to the messages won't work with private
messaging. It may be best to delete all older messages.

Now, let's make the private messages show up in the chat window as well. If we just add the messages to the chat window, everybody can read our messages—we don't want that. Instead, let's wrap all the privat messages in transient tags:

```html
<script>
webstrate.on("loaded", function(webstrateId, clientId, user) {
	var userName = prompt("Enter name:", "Anonymous");
	var chatWindow = document.getElementById("chatWindow");
	var recipientBox = document.createElement("transient");
	recipientBox.setAttribute("id", "recipientBox");
	var inputField = document.getElementById("inputField");
	var submitButton = document.getElementById("submitButton");

	document.body.insertBefore(recipientBox, inputField);

	submitButton.addEventListener("click", function() {
		var recipientId = recipientBox.getAttribute("clientid");
		var recipient = recipientBox.innerText;
		var timestamp = new Date().toISOString().substr(11,8);

		if (recipientId) {
			chatWindow.webstrate.signal({ userName: userName, text: inputField.value }, [recipientId]);
			chatWindow.insertAdjacentHTML('beforeend', '<transient>' +
				'<div class="private chatEntry" ' +
				'title="clientId: ' + clientId +'" clientid="' + clientId + '">' +
					'<span class="timestamp">' + timestamp + '</span> ' +
					'<span class="username">To: ' + recipient + '</span>: ' +
					'<span class="message">' + inputField.value + '</span>' +
				'</div>' +
			'</transient>\n');
		} else {
			chatWindow.insertAdjacentHTML('beforeend', '<div class="chatEntry" ' +
				'title="clientId: ' + clientId + '" clientid="' + clientId + '">' +
				'<span class="timestamp">' + timestamp + '</span> ' +
				'<span class="username">' + userName + '</span>: ' +
				'<span class="message">' + inputField.value + '</span>' +
			'</div>\n');
		}
		inputField.value = "";
	});

	chatWindow.addEventListener("dblclick", function(e) {
		if (e.target.className === "username") {
			recipientBox.setAttribute("clientid", e.target.parentElement.getAttribute("clientid"));
			recipientBox.innerText = e.target.parentElement.querySelector(".username").innerText;
		} else {
			recipientBox.removeAttribute("clientid");
			recipientBox.innerText = "";
		}
	});

	chatWindow.webstrate.on("signal", function(message, senderId, node) {
		var timestamp = new Date().toISOString().substr(11,8);
		chatWindow.insertAdjacentHTML('beforeend', '<transient>' +
			'<div class="private chatEntry" ' +
			'title="clientId: ' + senderId + '" clientid="' + senderId + '">' +
				'<span class="timestamp">' + timestamp + '</span> ' +
				'<span class="username">From: ' + message.userName + '</span>: ' +
				'<span class="message">' + message.text + '</span>' +
			'</div>' +
		'</transient>\n');
	});
});
</script>
```

Now, both sent and received messages are added to the chat window. To make it more obvious that the private messages are private, let's add a little styling:

```css
transient .chatEntry {
	color: #a00;
}
```

**Congratulations! You now have a chat system with private messaging in less than 60 lines of JavaScript!**
