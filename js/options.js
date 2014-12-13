angular.module('options', [])
    .config(['$compileProvider', function( $compileProvider ) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
    }])
    .controller('OptionsController', function($scope, $interval) {
        var chrStorage = chrome.storage;

        $scope.xssArray = [];
        $scope.addingMode = false;
        $scope.newXss = {};

        chrStorage.local.get('xssArray', function(items) {
            $scope.$apply(function() {
                $scope.xssArray = items.xssArray;
            })
        });

        $scope.saveChanges = function() {
            chrStorage.local.set({'xssArray': $scope.xssArray}, function() {});
        };

        $scope.addXss = function(event) {
            event.preventDefault();
            $scope.newXss.active = true;
            $scope.xssArray.push($scope.newXss);
            $scope.saveChanges();
            $scope.addingMode = false;
            $scope.newXss = {};
        };

        $scope.addingModeSwitch = function() {
            $scope.addingMode = !$scope.addingMode;
        };
    });