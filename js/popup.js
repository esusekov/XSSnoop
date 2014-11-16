angular.module('popup', [])
    .controller('PopupController', function($scope, $interval) {

        function messageHandler(message) {
            console.log(message);

            if (message.recipient === 'popup') {
                if (message.action === 'setFormsList') {
                    $scope.formsList = message.data.formsList;
                }
            }
        }

        function startLoadingLoop() {
            var dotsArr = ['', '.', '..', '...'];
            var counter = 0;
            $scope.loading = 'Loading';
            loopInterval = $interval(function () {
                counter = counter % 4;
                $scope.loading = 'Loading' + dotsArr[counter++];
            }, 400);
        }

        function checkFormsList() {
            var checkInterval = $interval(function () {
                var backgroundFormsList = chrExtension.getBackgroundPage().formsList;
                if (backgroundFormsList.length > 0) {
                    $scope.formsList = backgroundFormsList;
                }
                $interval.cancel(checkInterval);
            }, 1000);
        }

        var chrRuntime = chrome.runtime;
        var chrExtension = chrome.extension;
        var port = chrRuntime.connect();
        var loopInterval;

        chrRuntime.onConnect.addListener(function (port) {
            port.onMessage.addListener(messageHandler);
        });

        $scope.scanInProgress = false;
        $scope.formsList = [];

        $scope.startScan = function () {
            chrExtension.getBackgroundPage().sendMessage({
                sender: 'popup',
                recipient: 'content-script',
                action: 'scanPage'
            });
            $scope.scanInProgress = true;
            startLoadingLoop();
            checkFormsList();
        };

    });