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
    this.options = _.extend(defaults, options);

    _.bindAll(this);
}

LXC.prototype.path = function(id) {
    return path.join(this.options.baseDirectory, id);
};

LXC.prototype.rootfsPath = function(id) {
    return path.join(
        this.path(id),
        this.options.paths.rootfs
    );
};

LXC.prototype.configPath = function(id) {
    return path.join(
        this.path(id),
        this.options.paths.config
    );
};

LXC.prototype.exists = function exists(id) {
    return utils.fsExists(this.rootFsPath(id));
};

LXC.prototype.destroy = commandMaker('destroy');

LXC.prototype.start = commandMaker('start');

LXC.prototype.startEphemeral = commandMaker('startEphemeral');

LXC.prototype.freeze = commandMaker('freeze');

LXC.prototype.unfreeze = commandMaker('unfreeze');

LXC.prototype.create = commandMaker('create');

LXC.prototype.execute = commandMaker('execute');

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
    var promise = utils.spawn('lxc-list');
    return promise.then(this._parseList);
};

LXC.prototype.listByType = function listByType(type) {
    return this.list.get(type);
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
    var executable = this.options.commands[commandName];

    var defaultOptions = this.options.defaultArguments[commandName] || {};
    options = _.extend(defaultOptions, options);

    var args = this.mapArgs(commandName, options);

    return utils.spawn(executable, args);
};

// Maps javascript objects to command line arguments
LXC.prototype.mapArgs = function mapArgs(executableType, args) {
    var base = this.options.argumentMappings.base;
    var mappings = this.options.argumentMappings[executableType] || {};
    var finalMappings = _.extend(base, mappings);

    // Use defined arguments only
    var validKeys = _.chain(args).keys().filter(function(key) {
        return _.has(finalMappings, key);
    }).value();

    var cleanArgs = _.pick(args, validKeys);
    var newArgs = {};

    _.each(validKeys, function(key) {
        var newKey = finalMappings[key];
        newArgs[newKey] = cleanArgs[key];
    });

    // Transform to an array accepted by span
    var flatArgs = _.chain(newArgs).pairs().flatten().value();
    return flatArgs;
};


// Exports
exports.LXC = LXC;          // Class (useful for customisation)
exports.lxc = new LXC();    // Singleton
