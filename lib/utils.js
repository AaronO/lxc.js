// Requires
var Q = require('q');
var _ = require('underscore');

// Node requires
var fs = require('fs');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

// Alias
var stringify = JSON.stringify;

function simpleSpawn(processName, processArgs) {
    var spawned = spawn(processName, processArgs);
    var output = {
        stdout : '',
        stderr : '',
        returnCode : 0,
        command: processName,
        args: processArgs
    };

    // Promise
    var deffered = Q.defer();

    // Accumulate output data
    spawned.stdout.on('data', function(data) {
        output.stdout += data;
    });
    spawned.stderr.on('data', function(data) {
        output.stderr += data;
    });

    // When finished executing
    spawned.on('exit', function(returnCode) {
        var error;
        output.returnCode = returnCode;

        if(0 === returnCode) {
            // Success
            return deffered.resolve(output);
        } else {
            // Failure
            return deffered.reject(Error(stringify(output)));
        }


    });
    return deffered.promise;
}


function simpleExec(command) {
    var deffered = Q.defer();
    exec(command, function(error, stdout, stderr) {
        if(error) {
            return deffered.reject(Error(error));
        }
        return deffered.resolve({
            stdout: stdout,
            stderr: stderr,
            command: command
        });
    });
    return deffered.promise;
}


function fsExists(path) {
    var deffered = Q.defer();
    fs.exists(path, function(exists) {
        return deffered.resolve(exists);
    });
    return deffered.promise;
}

// Sorter specifically for indexOf
function sortVal(val) {
    return val === -1 ? Infinity : val;
}

// Simple one argument indexOf (easier to compose)
// Instead of javascript's multiargument one ...
function indexOf(val) {
    return this.indexOf(val);
}

// Useful for sorting array with another value
function sortBy(toSort, orderArray, mapper) {
    mapper = mapper || _.identity;
    var sorter = _.compose(
        sortVal,
        indexOf.bind(orderArray),
        mapper
    );
    return _.sortBy(toSort, sorter);
}

readDir = Q.nbind(fs.readdir);

// Exports
exports.spawn = simpleSpawn;
exports.exec = simpleExec;
exports.fsExists = fsExists;
exports.readDir = readDir;
exports.sortBy = sortBy;
