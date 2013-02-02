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
.then(function() {
    return lxc.create(vmData);
})
.then(function() {
    return lxc.start(vmData);
})
.then(function() {
    return lxc.list().then(console.log).fail(console.log);
 })
.delay(30000) // Wait till booted
.then(function() {
    return lxc.execute(vmData);
})
.then(function() {
    return lxc.destory(vmData);
})
.then(function() {
    console.log("Everything went as planned");
})
.fail(function() {
    console.log("You have failed this City !!!");
    console.log.apply(null, arguments);
});
