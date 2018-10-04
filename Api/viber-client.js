"use strict";

const _ = require('underscore');
const needle = require('needle');
const util = require('util');
const pjson = require(__dirname + '/../package.json');

const SUCCESSFUL_REQUEST_STATUS = 0;
const VIBER_AUTH_TOKEN_HEADER = "X-Viber-Auth-Token";
const MAX_GET_ONLINE_IDS = 100;
const API_ENDPOINTS = {
	"setWebhook": "/set_webhook",
	"getAccountInfo": "/get_account_info",
	"getUserDetails": "/get_user_details",
	"getOnlineStatus": "/get_online",
	"sendMessage": "/send_message",
	"post": "/post"
};

function ViberClient(logger, bot, apiUrl, subscribedEvents) {
	this._logger = logger;
	this._bot = bot;
	this._url = apiUrl;
	this._subscribedEvents = subscribedEvents;
	this._userAgent = util.format("ViberBot-Node/%s", pjson.version);
}

ViberClient.prototype.setWebhook = function(url, isInline) {
	this._logger.info("Sending 'setWebhook' request for url: %s, isInline: %s", url, isInline);
	return this._sendRequest("setWebhook", {
		"url": url,
		"is_inline": isInline,
		"event_types": this._subscribedEvents
	});
};
