"use strict";

angular.module("TerritoryManager.controllers", []).controller("TerritoryDetailCtrl", ["$scope", "$routeParams", "shared", function ($scope, $routeParams, shared) {
    $scope.territory = new Territory();

    if ($routeParams.territoryId) {
        $scope.territory = shared.currentTerritory;
    }
}]);