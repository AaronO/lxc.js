// Requires
var Q = require('q');
var _ = require('underscore');

// Node requires
var fs = require('fs');
var spawn = require('child_process').spawn;


function simpleSpawn(processName, processArgs) {
    var spawned = spawn(processName, processArgs);
    var output = {
        stdout : '',
        stderr : '',
        returnCode : 0
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
            deffered.resolve(output);
        } else {
            // Failure
            deffered.reject(Error('Spawned program exited upon failure'));
        }


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


readDir = Q.nbind(fs.readdir);

// Exports
exports.spawn = simpleSpawn;
exports.fsExists = fsExists;
exports.readDir = readDir;