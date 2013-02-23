"use strict";

// Requires
var Q = require('q');
var _ = require('underscore');

// Node requires
var path = require('path');

// Local requires
var utils = require('./utils');

// Constants
var defaults = require('./defaults.json');


// Utility function
function commandMaker(commandName) {
    return function(options) {
        return this.command(commandName, options);
    };
}

/*
 * Wraps the command line executables
 */
function LXC(options) {
    this.options = _.defaults(options, defaults);

    this.mapArgFuncs = {
        'boolean': function(values) {
            var key = values[0],
                value = values[1];
            return value ? [key, ''] : [];
        },
        'array': function(values) {
            var key = values[0],
                valueList = values[1];

            return _.map(valueList, function(value) {
                return [key, value];
            });
        }
    };

    _.bindAll(this);
}

LXC.prototype.path = function(id) {
    return path.join(this.options.paths.base, id);
};

LXC.prototype.pathJoin = function(id, subPath) {
    return path.join(
        this.path(id),
        subPath
    );
};

LXC.prototype.rootfsPath = function(id) {
    return this.pathJoin(
        id,
        this.options.paths.rootfs
    );
};

LXC.prototype.configPath = function(id) {
    return this.pathJoin(
        id,
        this.options.paths.config
    );
};

LXC.prototype.fstabPath = function(id) {
    return this.pathJoin(
        id,
        this.options.path.fstab
    );
};

LXC.prototype.exists = function exists(id) {
    return utils.fsExists(this.rootfsPath(id));
};

// Usual LXC commands
LXC.prototype.destroy = commandMaker('destroy');

LXC.prototype.shutdown = commandMaker('shutdown');

LXC.prototype.halt = commandMaker('halt');

LXC.prototype.start = commandMaker('start');

LXC.prototype.startEphemeral = commandMaker('startEphemeral');

LXC.prototype.freeze = commandMaker('freeze');

LXC.prototype.unfreeze = commandMaker('unfreeze');

LXC.prototype.create = commandMaker('create');

LXC.prototype.execute = commandMaker('execute');

LXC.prototype.netstat = commandMaker('netstat');

LXC.prototype.ps = commandMaker('ps');

// Needs special implementation
//LXC.prototype.monitor = commandMakerAsync('monitor');

// Parse lxc-list's output
LXC.prototype._parseList = function _parseList(output) {
    var states = defaults.states;
    var lines = output.stdout.split('\n');
    var results = {};
    var state;

    // Parse the lines of Stdout
    _.each(lines, function(line) {
        if(_.contains(states, line)) {
            // Change current state
            state = line.toLowerCase();
            results[state] = [];
            return;
        } else if(state && line) {
            // Append LXC name to state
            var instanceName = line.trim();
            results[state].push(instanceName);
        }

    });

    return results;
};

LXC.prototype.list = function list() {
    var promise = utils.exec('lxc-list');
    return promise.then(this._parseList);
};

LXC.prototype.listByType = function listByType(type) {
    return this.list().get(type);
};

LXC.prototype.running = function running() {
    return this.listByType('running');
};

LXC.prototype.stopped = function stopped() {
    return this.listByType('stopped');
};

LXC.prototype.frozen = function frozen() {
    return this.listByType('frozen');
};

LXC.prototype.all = function all() {
    return this.list().then(function(results) {
        return _.flatten([
            results.running,
            results.frozen,
            results.stopped
        ]);
    });
};

LXC.prototype.allByType = function allByType() {
    return this.list().then(function(results) {
        var response = {};
        var keys = _.keys(results);
        _.each(keys, function(status) {
            _.each(results[status], function(vmId) {
                response[vmId] = status;
            });
        });
        return response;
    });
};

// Runs a command for a given name
LXC.prototype.command = function command(commandName, options) {
    return utils.exec(
        this.buildCommand(commandName, options)
    );
};

LXC.prototype.buildCommand = function buildCommand(commandName, options) {
    var executable = this.options.commands[commandName];

    var defaultOptions = this.options.args.defaults[commandName] || {};
    options = _.defaults(options, defaultOptions);

    var args = this.mapArgs(commandName, options);
    var argsString = args.join(' ');

    return executable + ' ' + argsString;
};

// Maps JS types to appopriate command line strings
LXC.prototype.mapArg = function mapArg(values) {
    var key = _.first(values);
    var value = _.last(values);

    // Don't show false booleans
    var mapper = this.mapArgFuncs[typeof(value)] || _.identity;

    return mapper([key, value]);
};

// Maps javascript objects to command line arguments
// This really is kind of complex but it keeps the rest
// rather simple, ...
LXC.prototype.mapArgs = function mapArgs(executableType, args) {
    var base = this.options.args.mappings.base;
    var mappings = _.clone(
        this.options.args.mappings[executableType] || {}
    );
    var finalMappings = _.defaults(mappings, base);

    // Use defined arguments only
    var validKeys = _.chain(args).keys().filter(function(key) {
        return _.has(finalMappings, key);
    }).value();

    // Get accecpted arguments
    var cleanArgs = _.pick(args, validKeys);
    var newArgs = {};

    // Convert to command line format
    _.each(validKeys, function(key) {
        var newKey = finalMappings[key];

        // Convert key to new key
        newArgs[newKey] = cleanArgs[key];
    });

    // Transform to an array accepted by span
    // while removing and transforming args if necessary
    var flatArgs = _.chain(newArgs).pairs().map(this.mapArg).flatten().value();

    // Order arguments when important (lxc-execute for example)
    var argOrder = this.options.args.order[executableType] || [];
    return utils.sortBy(flatArgs, argOrder, _.last);
};


// Exports
exports.LXC = LXC;          // Class (useful for customisation)
exports.lxc = new LXC();    // Singleton
