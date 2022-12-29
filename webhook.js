var app = require("express")();
var bodyParser = require("body-parser");
var request = require("request");
require("dotenv").config();
const dialogflow = require("@google-cloud/dialogflow");
const uuid = require("uuid");
var serviceAccount = require("./fbnode-bot-iysg-744a143b2080.json");
// var googleAuth = require("google-oauth-jwt");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(process.env.PORT || 5000, () => {
	console.log(`Server listening on port ${process.env.PORT}`);
});

app.get("/", (req, res) => {
	res.status(201).send("Hello from localHost server");
});

/* For Facebook Validation */

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
	// console.log(req.body);
	if (req.body.object === "page") {
		req.body.entry.forEach((entry) => {
			entry.messaging.forEach((event) => {
				if (event.message && event.message.text) {
					sendMessage(event);
				}
			});
		});
		res.status(200).send("EVENT_RECIEVED");
	}
});

///send Message funtion//

async function sendMessage(event) {
	let sender = event.sender.id;
	let text = event.message.text;
	// console.log("recieved message:", text);
	var reply = await getDialog(text, process.env.SER_ACC_PRO_ID, credts);
	request(
		{
			uri: `https://graph.facebook.com/v15.0/me/messages`,
			qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
			method: "POST",
			json: {
				recipient: { id: sender },
				message: { text: reply.toString() },
			},
		},
		function (error, response) {
			// console.log(response.body);
			if (error) {
				console.log("  Error sending message: ", error);
			} else if (response.body.error) {
				console.log("Response Error: ", response.body.error);
			}
		}
	);
}

///////////////////////////////////////////////////////////////
var credts = {
	client_email: process.env.SER_ACC_CLIENT_MAIL,
	privateKey: process.env.SER_ACC_PRI_KEY,
};
async function getDialog(text, projectId, credts) {
	// A unique identifier for the given session
	const sessionId = uuid.v4();

	// Create a new session
	const sessionClient = new dialogflow.SessionsClient({
		projectId,
		credts,
	});
	const sessionPath = sessionClient.projectAgentSessionPath(
		projectId,
		sessionId
	);

	// The text query request.
	const request = {
		session: sessionPath,
		queryInput: {
			text: {
				// The query to send to the dialogflow agent
				text: text,
				// The language used by the client (en-US)
				languageCode: "en-US",
			},
		},
	};

	// Send request and log result
	const responses = await sessionClient.detectIntent(request);
	// console.log("Detected intent");
	const result = responses[0].queryResult;
	// console.log(`  Query: ${result.queryText}`);
	// console.log(`  Response: ${result.fulfillmentText}`);
	// if (result.intent) {
	// 	console.log(`  Intent: ${result.intent.displayName}`);
	// } else {
	// 	console.log("  No intent matched.");
	// }
	if (result) return result.fulfillmentText;
}

///webhooked//
app.post("/ai", (req, res) => {
	var result = req.body.queryResult;
	// console.log(result.parameters["geo-city"]);
	if (result.allRequiredParamsPresent) {
		let city = result.parameters["geo-city"];
		var restUrl =
			"http://api.openweathermap.org/data/2.5/weather?APPID=" +
			process.env.WEATHER_API_KEY +
			"&q=" +
			city; /////open weather api url

		request.get(restUrl, (err, response, body) => {
			if (!err && response.statusCode == 200) {
				let json = JSON.parse(body);
				let msg =
					json.weather[0].description +
					" and the temperature is " +
					json.main.temp +
					" ℉";
				// console.log(msg);
				return res.json({
					fulfillmentText: msg,
				}); ///webhook res should be in this format///
			} else {
				return res.status(400).json({
					status: {
						code: 400,
						errorType: "I failed to look up the city name.",
					},
				});
			}
		});
	}
});
