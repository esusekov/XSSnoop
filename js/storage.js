var chrStorage = chrome.storage.local;
var chrRuntime = chrome.runtime;

chrome.storage.onChanged.addListener(function(changes) {
    $rootScope.$broadcast('storageChanged', changes);
});

var storageManager = {
    get: function(name) {
        chrStorage.get(name, function(items) {
            if (!chrRuntime.lastError) {
                    items: items[name]
            }
        });

        return deferred.promise;
    },

    set: function(obj) {
        var deferred = $q.defer();

        chrStorage.set(obj, function () {

        });
    };

this.remove = function(name) {
    var deferred = $q.defer();

    chrStorage.remove(name, function () {
        $scope.$apply(function() {
            if (chrRuntime.lastError) {
                deferred.reject(chrRuntime.lastError.message);
            } else {
                deferred.resolve();
            }
        });
    });

    return deferred.promise;
}

});