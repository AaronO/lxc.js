var Q = require('q');
var lxc = require('./lib/lxc.js').lxc;
var defaults = require('./lib/defaults.json');


// Our VM data
var vmData = {
    name: "blabla",
    command: "echo hipsters" // Will only be used by .execute
};


lxc.exists(vmData)
.then(function(exists) {
    if(exists) {
        return lxc.destroy(vmData);
    }
})
.then(function() {
    return lxc.create(vmData);
})
.then(function() {
    return lxc.start(vmData);
})
.then(function() {
    return lxc.list().then(console.log).fail(console.log);
 })
//.delay(10000)
.then(function() {
    return lxc.execute(vmData);
})
.then(function() {
    return lxc.destory(vmData);
})
.fail(console.log);
