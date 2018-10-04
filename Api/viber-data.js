"use strict";

const _ = require('underscore');
const util = require('util');
const EventEmitter = require('events');
const JSONBig = require('json-bigint')({"storeAsString": true});

const NoopLogger = require(__dirname + '/noop-logger');
const EventConsts = require(__dirname + '/event-consts');
const ViberClient = require(__dirname + '/viber-client');
const Middleware = require(__dirname + '/middleware');
const RegexMatcherRouter = require(__dirname + '/regex-matcher-router');

const MessageFactory = require(__dirname + '/message/message-factory');
const MessageValidator = require(__dirname + '/message/message-validator');
const Message = require(__dirname + '/message/message');
const TextMessage = require(__dirname + '/message/text-message');

const UserProfile = require(__dirname + '/user-profile');
const Response = require(__dirname + '/response');

const REQUEST_TYPE = {};
REQUEST_TYPE.SEND_MESSAGE = "send_message";
REQUEST_TYPE.POST_TO_PUBLIC_CHAT = "post_to_public_chat";

const REQUIRED_CONFIGURATION_FIELDS = ["authToken", "name", "avatar"];
const SUBSCRIBED_EVENTS = ["subscribed", "unsubscribed", "conversation_started", "message", "delivered", "seen"];
const API_URL = "https://chatapi.viber.com/pa";

function ViberBot(loggerOrConfiguration, configuration) {

	// backward compatibility: we are still allowing ctor as (logger, configuration);
	// newer should use (configuration) with logger property in it.
	let logger;
	if (!configuration) {
		// no logger, treat loggerOrConfiguration as configuration
		configuration = loggerOrConfiguration;
		logger = configuration.logger || NoopLogger;
	}
	else {
		logger = loggerOrConfiguration || NoopLogger;
	}

	if (!configuration) {
		throw new Error(`Invalid configuration`);
	}

	const missingFields = this._getMissingFieldsInConfiguration(configuration);
	if (!_.isEmpty(missingFields)) {
		throw new Error(`Invalid configuration ${configuration}. Missing fields: ${missingFields}`);
	}

	this.authToken = configuration.authToken;
	this.name = configuration.name;
	this.avatar = configuration.avatar;

	this._logger = logger;
	this._client = new ViberClient(this._logger, this, API_URL, configuration.registerToEvents || SUBSCRIBED_EVENTS);
	this._middleware = new Middleware(this._logger, new MessageValidator(this._logger, this.authToken));
	this._messageFactory = new MessageFactory(this._logger);
	this._regexMatcherRouter = new RegexMatcherRouter(this._logger);
	this._callbacks = { [EventConsts.CONVERSATION_STARTED]: []};

	this._registerStreamAndHandleEvents(this._middleware.getStream());
	this._setupTextMessageReceivedHandler();
	this._setupConversationStartedHandler();
}
util.inherits(ViberBot, EventEmitter);
