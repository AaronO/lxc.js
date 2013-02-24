var lxc = require('../lib/lxc.js').lxc;

lxc.all().then(function (instances) {
    var tempInstances = instances.filter(function(instance) {
        return instance.search('temp') !== -1;
    });

    tempInstances.forEach(function(instance) {
        console.log('Destroying', instance);

        // Destroy
        lxc.destroy({
            name: instance
        })
        .then(function() {
            console.log('Destroyed', instance);
        })
        .fail(function() {
            console.log('Failed', instance);
        });
    });

});