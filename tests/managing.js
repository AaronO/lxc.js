var Q = require('q');
var lxc = require('../lib/lxc.js').lxc;
var defaults = require('../lib/defaults.json');


// Our VM data
var vmData = {
    name: 'blabla'
};

function tap() {
    console.log(arguments);
    return this;
}


lxc.exists(vmId)
.then(function(exists) {
    console.log('Exists = ', exists);
    if(exists) {
        return lxc.destroy(vmData);
    }
})
.then(tap)
.then(function() {
    return lxc.create(vmData);
})
.then(tap)
.then(function() {
    return lxc.start(vmData);
})
.then(tap)
.then(lxc.list)
.then(tap)
.then(function() {
    return lxc.shutdown(vmData);
})
.then(tap)
.then(function() {
    return lxc.destory(vmData);
})
.then(tap)
.then(function() {
    console.log("Everything went as planned");
})
.fail(function() {
    console.log("You have failed this City !!!");
    console.log.apply(null, arguments);
});
