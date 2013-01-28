// Requires
var Q = require('q');
var _ = require('underscore');

// Node requires
var fs = require('fs');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;


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
            deffered.reject(Error('Failed Spawning : ' + processName + ' with args : ' + processArgs));
        }


    });
    return deffered.promise;
}


function simpleExec(command) {
    var deffered = Q.defer();
    exec(function(error, stdout, stderr) {
        if(error) {
            throw Error();
        }
        deffered.resolve({
            stdout: stdout,
            stderr: stder
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


readDir = Q.nbind(fs.readdir);

// Exports
exports.spawn = simpleSpawn;
exports.exec = simpleExec;
exports.fsExists = fsExists;
exports.readDir = readDir;