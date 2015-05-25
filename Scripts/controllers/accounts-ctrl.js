"use strict";

angular.module("TerritoryManager.controllers", []).controller("AccountsCtrl", ["$scope", "$location", "$http", "shared", function ($scope, $location, $http, shared) {
    $scope.master = shared.currentUser;
    $scope.user = angular.copy($scope.master);

    $scope.$on('$viewContentLoaded', function () {
        $scope.congregation = shared.currentCongregation;
        $scope.getUsers($scope.congregation.Id);
    });

    $scope.messages = [];

    //$scope.$on("broadcastMessage", function () {
    //	if (shared.message) {
    //		if (shared.message.context == "accounts") {
    //			$scope.messages = [shared.message];
    //		}
    //		if (shared.message.context == "login") {
    //			$scope.loginText = shared.message.text;
    //		}
    //	}
    //	else {
    //		$scope.messages = undefined;
    //	}
    //});

    $scope.isPowerUser = function (user) {
        if (user.Roles) {
            if (user.Roles.indexOf('PowerUser') >= 0) return true;
            else return false;
        }
    }

    $scope.isAdmin = function (user) {
        if (user.Roles) {
            if (user.Roles.indexOf('Admin') >= 0) return true;
            else return false;
        }
    }

    $scope.isUser = function (user) {
        if (user.Roles) {
            if (user.Roles.indexOf('User') >= 0) return true;
            else return false;
        }
    }


    $scope.getUsers = function (congId) {
        shared.broadcastLoading(true);

        $scope.users = [];
        if (congId) {
            $http({ method: 'GET', url: urlWebAPI + '/user/getbycongid?id=' + congId, headers: shared.config.headers })
                .success(function (data) {
                    if (data) {
                        $.each(data, function (index, u) {
                            var user = new User();
                            user.Id = u.Id;
                            user.UserName = u.UserName;
                            user.Status = u.Status;

                            if (u.Roles) {
                                for (var i = 0; i < u.Roles.length; i++) {
                                    user.Roles.push(u.Roles[i].RoleName);
                                }
                            }
                            $scope.users.push(user);
                        });
                    }
                    shared.broadcastLoading(false);
                    setTimeout(function () {
                        $(".users ul").listview("refresh");
                    }, 1);
                })
                .error(function () {
                    shared.broadcastLoading(false);
                });
        }
    }

    $scope.showRegistrationText = false;

    $scope.register = function () {
        $scope.user.Status = "Pending";
        if (!$scope.congId || $scope.congId == 0) {
            shared.broadcastMessage("Please select the congregation in which you belong.", "warning", "account");
            return false;
        }

        for (var i = 0; i < $scope.congregations.length; i++) {
            if ($scope.congregations[i].Id == $scope.congId) {
                $scope.user.Congregations.push($scope.congregations[i]);
                break;
            }
        }

        $http({ method: 'POST', url: urlWebAPI + '/user/register', data: $scope.user })
            .success(function(data){
                $scope.showRegistrationText = true;
                shared.config.headers = { Authorization: "Basic " + Base64.encode($scope.user.UserName + ":" + $scope.user.Password) };
                shared.login();
            });
    }

    $scope.isUnchanged = function (user) {
        return angular.equals(user, $scope.master);
    };

    $scope.save = function () {
        //todo: saveUser()
        shared.broadcastCurrentUser($scope.user);
        $location.path("/settings");
    }

    $scope.congregations = [];

    $scope.getAllCongregations = function () {
        if ($scope.user.LoggedIn && $scope.user.Status == "Active") {
            $http({ method: 'GET', url: urlWebAPI + '/cong/getall/' })
                .success(function (congData) {
                    if (congData) {
                        $.each(congData, function (index, c) {
                            var cong = new Congregation();
                            cong.Id = c.Id;
                            cong.CongName = c.CongName;
                            cong.Address = c.Address;
                            $scope.congregations.push(cong);
                        });
                    }
                });
        }
    }

    $scope.getAllCongregations();
		
}]);