var Q = require('q');
var lxc = require('../lib/lxc.js').lxc;
var defaults = require('../lib/defaults.json');


// Our VM data
var vmId = 'blabla';
var vmData = {
    name: vmId,
    command: "echo hipsters" // Will only be used by .execute
};


lxc.exists(vmId)
.then(function(exists) {
    console.log('Exists = ', exists);
    if(exists) {
        return lxc.destroy(vmData);
    }
})
.tap(console.log)
.then(function() {
    return lxc.create(vmData);
})
.tap(console.log)
.then(function() {
    return lxc.start(vmData);
})
.tap(console.log)
.then(lxc.list)
.tap(console.log)
.delay(30000) // Wait till booted
.then(function() {
    return lxc.execute(vmData);
})
.tap(console.log)
.then(function() {
    return lxc.destory(vmData);
})
.tap(console.log)
.then(function() {
    console.log("Everything went as planned");
})
.fail(function() {
    console.log("You have failed this City !!!");
    console.log.apply(null, arguments);
});
