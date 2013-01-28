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


/*
 * Wraps the command line executables
 */
function LXC(options) {
    this.options = _.extend(defaults, options);

    _.bindAll(this);
}

LXC.prototype.path = function(id) {
    return path.join(this.options.baseDir, id);
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

LXC.prototype.destroy = function destroy(options) {
    return this.command('destroy', options);
};

LXC.prototype.start = function start(options) {
    return this.command('start');
};

LXC.prototype.startEphemeral = function startEphemeral(options) {
    return this.command('startEphemeral', options);
};

LXC.prototype.freeze = function freeze(options) {
    return this.command('freeze', options);
};

LXC.prototype.unfreeze = function unfreeze(options) {
    return this.command('unfreeze', options);
};

LXC.prototype.create = function create(options) {
    return this.command('create', options);
};

LXC.prototype.execute = function execute(options) {
    return this.command('execute', options);
};

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
            results[state].append(instanceName);
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

// Runs a command for a given name
LXC.prototype.command = function command(commandName, options) {
    var executable = this.options.commands[commandName];
    var args = this.mapArgs(commandName, options);
    return utils.spawn(executable, args);
};

// Maps javascript objects to command line arguments
LXC.prototype.mapArgs = function mapArgs(executableType, args) {
    var base = this.options.argMappings.base;
    var mappings = this.options.argMappings[executableType] || {};
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
    return flatArgs.join(' ');
};


// Exports
exports.LXC = LXC;          // Class (useful for customisation)
exports.lxc = new LXC();    // Singleton
