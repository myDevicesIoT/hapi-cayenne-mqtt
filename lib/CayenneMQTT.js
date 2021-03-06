var mqtt = require('mqtt');
var util = require('util');
var routes = require('routes');
var events = require('events');
var hostname = require('os').hostname();

const MQTT_VERSION   = 'v1';
const MQTT_THINGS    = 'things';
const MQTT_DATA      = 'data';
const MQTT_COMMAND   = 'cmd';
const MQTT_COMMAND_JSON = 'cmd.json';
const MQTT_RESPONSE  = 'response';

const DEFAULT_MQTT_PUB_QOS = 0;
const DEFAULT_MQTT_PUB_RETAIN = false;
const DEFAULT_MQTT_PUB_DUP = false;

function getTopic(username, thingId, resource, channel) {
    var tree = [
        MQTT_VERSION,
        username,
        MQTT_THINGS,
        thingId,
        resource,
    ];
    if (channel) {
        tree.push(channel);
    }

    return tree.join('/');
}

var MQTTListener = function (config, logger, router) {
    this.config = config;
    this.logger = logger;
    this.router = router;
}

MQTTListener.prototype.onConnect = function () {
    this.logger.info("Connected to %s", this.config.broker);
}

MQTTListener.prototype.onError = function (error) {
    this.logger.error(error);
}

MQTTListener.prototype.onDisconnect = function () {
    this.logger.error("Disconnected from %s", this.config.broker);
}

MQTTListener.prototype.onReconnect = function () {
    this.logger.info("Reconnected with %s", this.config.broker);
}

MQTTListener.prototype.onPacketSend = function (packet) {
    // if (packet.cmd == 'publish') {
    //     this.logger.log("PUBLISH %s\n    Payload: %s", packet.topic, packet.payload);
    // }
}

MQTTListener.prototype.onPacketReceive = function (packet) {
//    this.logger.log("RECV %s/%s\n    Payload: %s", packet.cmd, packet.topic, packet.payload);
}

MQTTListener.prototype.onMessage = function (topic, payload) {
    this.logger.log("NOTIFY %s\n    Payload: %s", topic, payload);

    var data  = payload.toString().split(',');
    var seq   = data[0];
    var value = data[1]; 

    var match = this.router.match(topic);

    if (match) {
        var p = match.params;
        match.fn(p.username, p.thingId, p.channel, value);
    }
}

var CayenneMQTT = function (options, logger) {
    this.config = {
        broker : options.MQTT_BROKER || "mqtt.mydevices.com",
        mqttConfig: {
            username: options.MQTT_USERNAME,
            password: options.MQTT_PASSWORD,
            clientId: options.MQTT_CLIENT_ID || "prometheus-" + hostname + "-" + process.pid
        },
        publish: {
            qos: options.MQTT_PUB_QOS != undefined ? parseInt(options.MQTT_PUB_QOS) : DEFAULT_MQTT_PUB_QOS,
            retain: options.MQTT_PUB_RETAIN != undefined ? (options.MQTT_PUB_RETAIN == "true") : DEFAULT_MQTT_PUB_RETAIN,
            dup: options.MQTT_PUB_DUP != undefined ? (options.MQTT_PUB_DUP == "true") : DEFAULT_MQTT_PUB_DUP
        }
    }

    
    this.logger = logger || console;

    this.router = routes();
    this.router.addRoute('v1/:username/things/:thingId/cmd/:channel', this.commandRoute);

    var listener = new MQTTListener(this.config, this.logger, this.router);

    this.mqttClient = new mqtt.connect("mqtt://" + this.config.broker, this.config.mqttConfig);

    this.mqttClient.on('error',         listener.onError        .bind(listener));
    this.mqttClient.on('connect',       listener.onConnect      .bind(listener));
    this.mqttClient.on('message',       listener.onMessage      .bind(listener));
    this.mqttClient.on('reconnect',     listener.onReconnect    .bind(listener));
    this.mqttClient.on('close',         listener.onDisconnect   .bind(listener));
    this.mqttClient.on('packetsend',    listener.onPacketSend   .bind(listener));
    this.mqttClient.on('packetreceive', listener.onPacketReceive.bind(listener));
    
    this.logger.log("Connecting using %s", JSON.stringify(this.config));
};

CayenneMQTT.prototype.__proto__ = events.EventEmitter.prototype;

CayenneMQTT.prototype.commandRoute = function (username, thingId, channel, value) {
    this.emit('cmd', username, thingId, channel, value);
}

CayenneMQTT.prototype.publish = function (topic, payload) {
    this.logger.log("PUBLISH %s\n    payload: %s", topic, payload);
    this.mqttClient.publish(topic, payload, this.config.publish);
}

CayenneMQTT.prototype.subscribe = function (topic) {
    this.mqttClient.subscribe(topic);
}

CayenneMQTT.prototype.unsubscribe = function (topic) {
    this.mqttClient.unsubscribe(topic);
}

CayenneMQTT.prototype.rawWrite = function (username, thingId, channel, value, type, unit) {
    if (type === undefined) {
        type = "null";
    }

    if (unit == undefined) {
        unit = "null";
    }

    var payload = util.format("%s,%s=%s", type, unit, JSON.stringify(value));

    this.publish(getTopic(username, thingId, MQTT_DATA, channel), payload)
}

CayenneMQTT.prototype.jsonWrite = function (username, thingId, json) {
    this.publish(getTopic(username, thingId, MQTT_DATA, 'json'), JSON.stringify(json));
}

CayenneMQTT.prototype.defaultsWrite = function (username, thingId, json) {
    this.publish(getTopic(username, thingId, MQTT_DATA, 'defaults'), JSON.stringify(json));
}

CayenneMQTT.prototype.subscribeCommands = function (username, thingId) {
    this.subscribe(getTopic(username, thingId, MQTT_COMMAND, '+'));
}

CayenneMQTT.prototype.unsubscribeCommands = function (username, thingId) {
    this.unsubscribe(getTopic(username, thingId, MQTT_COMMAND, '+'));
}

CayenneMQTT.prototype.publishResponse = function (username, thingId, payload) {
    this.publish(getTopic(username, thingId, MQTT_RESPONSE), payload);
}

CayenneMQTT.prototype.publishCommand = function (username, thingId, channel, payload) {
    this.publish(getTopic(username, thingId, MQTT_COMMAND, channel), payload);
}

CayenneMQTT.prototype.publishJSONCommand = function (username, thingId, payload) {
    this.publish(getTopic(username, thingId, MQTT_COMMAND_JSON), JSON.stringify(payload));
}

module.exports = CayenneMQTT;