var util = require('util');

var CayenneMQTT = require('./CayenneMQTT');

exports.Client = CayenneMQTT;

exports.register = function (server, options, done) {
    var logger = {
        log: function() {
            server.log(['debug', 'internal', 'cayenne'], util.format.apply(null, arguments));
        },
        info: function() {
            server.log(['info', 'internal', 'cayenne'], util.format.apply(null, arguments));
        },
        error: function() {
            server.log(['error', 'internal', 'cayenne'], util.format.apply(null, arguments));
        }
    }

    var client = new CayenneMQTT(options, logger);

    server.expose('client', client);

    return done();
};

exports.register.attributes = {
    pkg: require('../package.json')
};
