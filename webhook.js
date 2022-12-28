var app = require("express")();
var bodyParser = require("body-parser");
var request = require("request");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(process.env.PORT || 5000, () => {
	console.log(`Server listening on port ${process.env.PORT} or 5000`);
});

/* For Facebook Validation */
app.get("/", (req, res) => {
	res.status(201).send("Hello from localHost server");
});
app.get("/webhook", (req, res) => {
	// Parse the query params
	let mode = req.query["hub.mode"];
	let token = req.query["hub.verify_token"];
	let challenge = req.query["hub.challenge"];

	// Check if a token and mode is in the query string of the request
	if (mode && token) {
		// Check the mode and token sent is correct
		if (mode === "subscribe" && token === "tuxedo_cat") {
			// Respond with the challenge token from the request
			console.log("WEBHOOK_VERIFIED");
			res.status(200).send(challenge);
		} else {
			// Respond with '403 Forbidden' if verify tokens do not match
			res.sendStatus(403);
		}
	}
});

/* Handling all messages */
app.post("/webhook", (req, res) => {
	console.log(req.body);
	if (req.body.object === "page") {
		req.body.entry.forEach((entry) => {
			entry.messaging.forEach((event) => {
				if (event.message && event.message.text) {
					sendMessage(event);
				}
			});
		});
		res.status(200).end();
	}
});

///send Message funtion//

var sendMessage = (event) => {
	var sender = event.sender.id;
};
