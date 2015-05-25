"use strict";

angular.module("TerritoryManager.controllers", []).controller("HouseholderDetailCtrl", ["$scope", "$routeParams", "$http", "shared", function ($scope, $routeParams, $http, shared) {
    $scope.$on('$viewContentLoaded', function () {
        var hId = $routeParams.householderId;
        $scope.householder = new Householder();
        $scope.getHouseholder(hId);
        $scope.suggestedTerritoriesShown = $scope.householder.Id == 0 ? true : false;
        $scope.householder.Id == 0 ? $scope.getSuggestedTerritories() : $scope.getAllTerritories();
        $scope.isActiveUser = $scope.user.Status == "Active";
    });

    $scope.getHouseholder = function (id) {
        if (id && id > 0) {
            for (var i = 0; i < shared.householders.length; i++) {
                if (shared.householders[i].Id == id) {
                    $scope.householder = shared.householders[i];
                    shared.broadcastCurrentHouseholder($scope.householder);
                }
            }
        }
    }

    $scope.newLocation = "";

    $scope.geocode = function (address) {
        geocoder = new google.maps.Geocoder();
        geocoder.geocode({ 'address': address }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                $scope.newLocation = results[0].geometry.location;
            }
            else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                setTimeout(function () {
                    $scope.geocode(address);
                }, 100);
            }
        });
    }

    $scope.getSuggestedTerritories = function () {
        shared.broadcastLoading(true);
        $scope.suggestedTerritories = [];
        var congId = $scope.user.Congregations ? $scope.user.Congregations[0].Id : 0;

        $http({ method: 'GET', url: urlWebAPI + '/territory/getsuggestedterritories?location=' + $scope.newLocation + "&congid=" + congId, headers: shared.config.headers })
            .success(function (data) {
                if (data) {
                    $.each(data, function (index, t) {
                        var terr = new Territory();
                        terr.Id = t.Id;
                        terr.TerritoryName = t.TerritoryName;
                        terr.MiddleLocation = t.MiddleLocation;
                        terr.TerritoryType = t.TerritoryType;
                        $scope.suggestedTerritories.push(terr);
                    });
                }

                shared.broadcastLoading(false);
                $scope.suggestedTerritoriesShown = true;
            })
            .error(function () {
                shared.broadcastLoading(false);
            });
    }

    $scope.getAllTerritories = function () {
        $scope.territoryOptions = shared.territories;
        $scope.suggestedTerritoriesShown = false;
    }

}]);