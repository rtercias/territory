angular.module("TerritoryManager.directives", [])
	.directive("applyJqMobile", function ($location, shared) {
	    return function ($scope, el) {
	        $(".householders-list, .householder-buttons").hide();
	        setTimeout(function () {
	            $scope.$on("$viewContentLoaded", el.parent().trigger("create"));
	            $(".householders-list, .householder-buttons").show();
	        }, 1);
	    }
		
	})
	.directive("login", function() {
		return {
			restrict: "E",
			scope: {
				loginText: "=loginText"
			},
			template: '<a data-toggle="dropdown">{{loginText}}</a>',
			controller: function ($scope, shared) {
				$scope.loginText = shared.currentUser.LoggedIn ? "Logged in: " + shared.currentUser.UserName : "Log in";
			},
			replace: true
		}
	})
    .directive("checkUser", ["$rootScope", "$location", "shared", function ($root, $location, shared) {
        return {
            link: function (scope, elem, attrs, ctrl) {
                $root.$on("$routeChangeStart", function (event, currRoute, prevRoute) {
                    if (currRoute && currRoute.access && shared.currentUser) {
                        if ($location.path() != "/" && !currRoute.access.isFree && !shared.currentUser.LoggedIn) {
                            console.log(shared.currentUser.LoggedIn);
                        }
                    }
                });
            }
        }
    }])
    .directive('ngAltT', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if (event.altKey && event.which === 84) {
                    scope.$apply(function () {                        
                        scope.$eval(attrs.ngAltT);
                    });

                    event.preventDefault();
                }
            });
        };
    })
    .directive('ngAltH', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if (event.altKey && event.which === 72) {
                    scope.$apply(function () {
                        scope.$eval(attrs.ngAltH);
                    });

                    event.preventDefault();
                }
            });
        };
    })
    .directive('ngAltS', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if (event.altKey && event.which === 83) {
                    scope.$apply(function () {
                        scope.$eval(attrs.ngAltS);
                    });

                    event.preventDefault();
                }
            });
        };
    })
    .directive('ngSplitColumn', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                setTimeout(function () {
                    $(element).easyListSplitter({ colNumber: scope.$eval(attrs.ngSplitColumn) });
                }, 1);
            }
        };
    })
;

	