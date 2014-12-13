angular.module('popup', [])
    .config(['$compileProvider', function( $compileProvider ) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
    }])
    .controller('PopupController', function($scope, $interval) {

        function messageHandler(message) {

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
            $scope.checkInterval = $interval(function () {
                var backgroundFormsList = chrExtension.getBackgroundPage().formsList.slice();
                if (backgroundFormsList.length > 0) {
                    $scope.formsList = backgroundFormsList;
                }

            }, 1000);
        }

        function init() {
            var backgroundFormsList = chrExtension.getBackgroundPage().formsList.slice();
            if (backgroundFormsList.length > 0) {
                $scope.scanInProgress = true;
                checkFormsList();
            }
        }

        var chrRuntime = chrome.runtime;
        var chrExtension = chrome.extension;
        var port = chrRuntime.connect();
        var loopInterval;

        var imgUrls = {
            inprogress: chrExtension.getURL('img/load.gif'),
            vulnerable: chrExtension.getURL('img/done.png'),
            safe: chrExtension.getURL('img/done.png'),
        };

        $scope.getImgUrl = function(status) {
            return imgUrls[status];
        };

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

        $scope.cancel = function() {
            $interval.cancel($scope.checkInterval);
            $scope.formsList = [];
            $scope.scanInProgress = false;
            chrExtension.getBackgroundPage().cancelScan();
        };

        init();

    });