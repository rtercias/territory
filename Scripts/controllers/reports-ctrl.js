"use strict";

angular.module("TerritoryManager.controllers", []).controller("ReportsCtrl", ["$scope", "shared", function ($scope, shared) {
    var congId = shared.currentCongregation.CongId;
    $scope.summary = getSummary(congId);
    $scope.doNotCalls = getDoNotCalls(congId);
}]);
