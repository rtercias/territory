"use strict";

angular.module("TerritoryManager.controllers", []).controller("MapCtrl", ["$scope", "$location", "$http", "$cookieStore", "shared", "orderByFilter", function ($scope, $location, $http, $cookieStore, shared, orderByFilter) {
    $scope.getReport = function () {
        try {
            //attempt login first
            if ($cookieStore.get("headers")) {
                shared.login(function(user) {
                    //check if role is sufficient
                    if (user.Roles) {
                        if (user.Roles.indexOf('Admin') >= 0 || user.Roles.indexOf('PowerUser') >= 0) {
                            //get data
                            var terrId = ($location.search()).terrId;
                            $scope.congregation = user.Congregations ? user.Congregations[0] : new Congregation();
                            $scope.getTerritory(terrId);
                            $scope.getHouseholders(terrId);
                        }
                        else {
                            console.log("User has insiffucient permission to view the report.");
                        }
		                    
                    }
                    else {
                        console.log("User has insiffucient permission to view the report.");
                        return false;
                    }
                });
            }
        }
        catch (err) {
            console.log(err);		        
        }
    }

    $scope.getHouseholders = function (terrId) {
        $scope.householders = [];
        if (terrId) {
            $http({ method: 'GET', url: urlWebAPI + '/householder/getbyterr?terrId=' + terrId, headers: $cookieStore.get("headers") })
                .success(function (data) {
                    if (data) {
                        $.each(data, function (index, h) {
                            var householder = new Householder();
                            householder.Id = h.Id;
                            householder.TerritoryId = h.TerritoryId;
                            householder.SeqNum = h.SeqNum;
                            householder.Address = h.Address;
                            householder.AptNum = h.AptNum;
                            householder.City = h.City;
                            householder.State = h.State;
                            householder.Zip = h.Zip;
                            householder.Country = h.Country;
                            householder.Location = h.Location;
                            $scope.householders.push(householder);
                        });

                        $scope.householders = orderByFilter($scope.householders, "SeqNum");
                        $scope.setMapUrl();
                        $scope.setColumnedHouseholders();

                    }
                });
        }
    }

    $scope.getTerritory = function (terrId) {
        $scope.territory = new Territory();
        if (terrId) {
            $http({ method: 'GET', url: urlWebAPI + '/territory/get?id=' + terrId, headers: $cookieStore.get("headers") })
                .success(function (data) {
                    if (data) {
                        $scope.territory.Id = data.Id;
                        $scope.territory.TerritoryName = data.TerritoryName;
                        $scope.territory.MostCommonAddress = data.MostCommonAddress;
                        $scope.territory.TerritoryType = data.TerritoryType;
                    }
                });
        }
    }

    $scope.mapUrl = "";
		
    $scope.setMapUrl = function () {
        var addresses = "";
        var hh = orderByFilter($scope.householders, "SeqNum");
        var size = hh.length > 15 ? "400x400" : "550x500";
        var str = "http://maps.googleapis.com/maps/api/staticmap?size=" + size + "&scale=1&maptype=roadmap&sensor=true";
        for (var i = 0; i < hh.length ; i++) {
            var marker = "&markers=color:blue%7Clabel:" + numberToChar(hh[i].SeqNum);
            var address = i > 0 ? "|" : "";
            address += hh[i].Address + "+" + hh[i].AptNum + "," + hh[i].City + "," + hh[i].State + "+" + hh[i].Zip;
            addresses += address;

            str += marker + "%7C" + address;
        }

        $scope.mapUrl = str;
    }
		
    $scope.setColumnedHouseholders = function () {
        $scope.columnOneHouseholders = $scope.householders.slice(0, 15);
        $scope.columnTwoHouseholders = $scope.householders.slice(15);
    }

    $scope.addressLengthIsGood = function (h) {
        return (h.Address.length + h.AptNum.length) <= 25;
    }

    $scope.toChar = function (num) {
        return numberToChar(num);
    }

    $scope.householders = [];
    $scope.columnOneHouseholders = [];
    $scope.columnTwoHouseholders = [];
    $scope.territory;
    $scope.congregation;

    $scope.getReport();
}]);
