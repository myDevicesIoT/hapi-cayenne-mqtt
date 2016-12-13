# Hapi-Cayenne-MQTT
Hapi.JS plugin to connect to Cayenne MQTT API.

## Hapi initialization
When registering as an Hapi plugin, Cayenne will use Server logging facility. Cayenne MQTT instance will be available through *Server.plugins['hapi-cayenne-mqtt'].client*.

```javascript
server.register({
    register: require('hapi-cayenne-mqtt'),
    options: {
        MQTT_BROKER:        'mqtt.mydevices.com',
        MQTT_USERNAME:      'mqtt username',
        MQTT_PASSWORD:      'mqtt password'
    }
}, (err) => {
    if (err) {
        throw err;
    }
});


var mqtt = server.plugins['hapi-cayenne-mqtt'].client;
```

## Regular initialization
When using Cayenne out of Hapi, instance need to be manually created.

```javascript
var CayenneMQTT = require('hapi-cayenne-mqtt');

var mqtt = new CayenneMQTT.Client({
    MQTT_BROKER:        'mqtt.mydevices.com',
    MQTT_USERNAME:      'mqtt username',
    MQTT_PASSWORD:      'mqtt password'
})
```

## Plugin Use
No matter how the plugin has been initialized, use of MQTT remains the same. It is suggested to use **hapi-cayenne-types** plugin to get existing data types and units. 

```javascript
var userId = '';
var thingId = '';

var channel = 0;
var type = "temp";
var unit = "c";
var value = 22.4;

mqtt.rawWrite(userId, thingId, channel, value, type, unit);

var json = [
    {
        channel: 0,
        type: "temp",
        unit: "c",
        value: 22.4
    }
]

mqtt.jsonWrite(userId, thingId, json);

```

## Plugin Options

### MQTT_BROKER
Optional Cayenne MQTT Broker. Default to **mqtt.mydevices.com**

### MQTT_USERNAME
Optional Cayenne MQTT Username.

### MQTT_PASSWORD
Optional Cayenne MQTT Password.

### MQTT_CLIENT_ID
Optional Cayenne MQTT Client ID.
