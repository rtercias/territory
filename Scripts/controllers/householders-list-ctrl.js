"use strict";

angular.module("TerritoryManager.controllers", []).controller("HouseholderListCtrl", ["$scope", "$routeParams", "$location", "shared", "orderByFilter", function ($scope, $routeParams, $location, shared, orderByFilter) {
    $scope.templates = [{ name: "welcome", url: "templates/welcome.html" }];
    $scope.template = $scope.templates[0];
    $scope.territory;

    $scope.$on('$viewContentLoaded', function () {
        $scope.territory = new Territory();
        $scope.showWelcome = shared.showWelcome;

        if ($routeParams.territoryId) {
            var terrId = $routeParams.territoryId;
            var l = shared.territories.length;
            for (var i = 0; i < l; i++) {
                if (shared.territories[i].Id == terrId) {
                    $scope.territory = shared.territories[i];
                    shared.broadcastCurrentTerritory($scope.territory);
                    break;
                }
            }
        }
    });

    $scope.$on("broadcastHouseholders", function () {
        if (!$scope.$$phase) {
            $scope.$apply($scope.householders = shared.householders);
        }
        setTimeout(function () {
            $scope.showWelcome = !$scope.householders || $scope.householders.length == 0;
            $(".householders-list ul").listview("refresh");
        }, 1);
    });

    //$scope.$on("broadcastMapRendering", function () {
    //    if (!$scope.$$phase) {
    //        $scope.$apply($scope.mapIsRendering = shared.mapIsRendering);
    //    }
    //});

    $scope.$on("broadcastCurrentTerritory", function () {
        if (!$scope.$$phase) {
            $scope.$apply($scope.territory = shared.currentTerritory);
        }
    });

    $scope.$on("broadcastShowWelcome", function () {
        if (!$scope.$$phase) {
            $scope.$apply($scope.showWelcome = shared.showWelcome);
            console.log($scope.showWelcome);
        }
    });

    $scope.selectHouseholder = function (h) {
        $scope.householder = h;
    }

    $scope.mapIsRendering = false;

    $scope.messages = [];

    $scope.moveUp = function (h) {
        if (h.SeqNum == 1) {
            h.MessageType = "alert alert-warning";
            h.Message = "Address is already at the top";

            setTimeout(function () {
                $scope.$apply(function () {
                    h.Message = "";
                    h.MessageType = "";
                });
            }, 5000);

            return;
        }

        if (h.IsLocked) {
            h.MessageType = "alert alert-warning";
            h.Message = "This address is locked";

            setTimeout(function () {
                $scope.$apply(function () {
                    h.Message = "";
                    h.MessageType = "";
                });
            }, 5000);

            return;
        }

        //if ($scope.mapIsRendering) {
        //    return false;
        //}

        var origPos = parseInt(h.SeqNum);
        for (var i = origPos; i >= 1; i--) {
            if ($scope.householders[i - 2] && !$scope.householders[i - 2].IsLocked) {
                var newPos = parseInt(i - 1);
                h.SeqNum = newPos;
                $scope.householders[i - 2].SeqNum = origPos;

                var skipped = origPos - newPos - 1;
                if (skipped > 1) {
                    h.MessageType = "alert alert-warning";
                    h.Message = skipped + " locked addresses were skipped";
                    setTimeout(function () {
                        $scope.$apply(function () {
                            h.Message = "";
                            h.MessageType = "";
                        });
                    }, 5000);
                }
                break;
            }
        }
        h.IsLocked = true;
        shared.broadcastHouseholders($scope.householders);
    };

    $scope.moveDown = function (h) {
        if (origPos == $scope.householders.length) {
            h.MessageType = "alert alert-warning";
            h.Message = "Address is already at the bottom";

            setTimeout(function () {
                $scope.$apply(function () {
                    h.Message = "";
                    h.MessageType = "";
                });
            }, 5000);

            return;
        }

        if (h.IsLocked) {
            h.MessageType = "alert alert-warning";
            h.Message = "This address is locked";

            setTimeout(function () {
                $scope.$apply(function () {
                    h.Message = "";
                    h.MessageType = "";
                });
            }, 5000);

            return;
        }

        //if ($scope.mapIsRendering) {
        //    return false;
        //}

        var origPos = parseInt(h.SeqNum);
        for (var i = origPos; i <= $scope.householders.length; i++) {
            if (!$scope.householders[i].IsLocked) {
                var newPos = parseInt(i + 1);
                h.SeqNum = newPos;
                $scope.householders[i].SeqNum = origPos;

                var skipped = newPos - origPos - 1;
                if (skipped > 1) {
                    h.MessageType = "alert alert-warning";
                    h.Message = skipped + " locked addresses were skipped";
                    setTimeout(function () {
                        $scope.$apply(function () {
                            h.Message = "";
                            h.MessageType = "";
                        });
                    }, 5000);
                }
                break;
            }
        }
        h.IsLocked = true;
        shared.broadcastHouseholders($scope.householders);
    };

    $scope.setLock = function (h) {
        h.IsLocked = !h.IsLocked;
        h.Message = "";
        h.MessageType = "";
    };

    $scope.pad = function (num) {
        return pad(parseInt(num), 2);
    };
    $scope.tooltip = function (locked) {
        return locked ? "position locked" : "position unlocked";
    };
}]);