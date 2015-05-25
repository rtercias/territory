"use strict";

angular.module("TerritoryManager", [
	"ui.bootstrap", "TerritoryManager.services", "TerritoryManager.controllers",
	"TerritoryManager.filters", "TerritoryManager.directives", "http-auth-interceptor", "ngCookies"
])
	.config(["$routeProvider", "$locationProvider", function ($routeProvider, $locationProvider) {
		$routeProvider
			.when("/users", { templateUrl: "/templates/users-list.html", controller: "AccountsCtrl", access: { isFree: false } })
			.when("/cong", { templateUrl: "/templates/congregation-detail.html", controller: "CongregationCtrl", access: { isFree: false } })
			.when("/register", { templateUrl: "/templates/register.html", controller: "AccountsCtrl", access: { isFree: true } })
			.when("/settings", { templateUrl: "/templates/settings.html", controller: "AccountsCtrl", access: { isFree: false } })
			.when("/summary", { templateUrl: "/templates/summary.html", controller: "ReportsCtrl", access: { isFree: false } })
            .when("/dnc", { templateUrl: "/templates/dnc.html", controller: "ReportsCtrl", access: { isFree: false } })
            .when("/search/:text", { templateUrl: "/templates/search.html", controller: "ReportsCtrl", access: { isFree: false } })
  			.when("/edithouseholder/:householderId", { templateUrl: "/templates/householder-detail.html", controller: "HouseholderDetailCtrl", access: { isFree: false } })
  			.when("/addhouseholder", { templateUrl: "/templates/householder-detail.html", controller: "HouseholderDetailCtrl", access: { isFree: false } })
			.when("/editterritory/:territoryId", { templateUrl: "/templates/territory-detail.html", controller: "TerritoryDetailCtrl", access: { isFree: false } })
            .when("/survey/:territoryId", { templateUrl: "/templates/territory-detail.html", controller: "TerritoryDetailCtrl", access: { isFree: false } })
  			.when("/addterritory", { templateUrl: "/templates/territory-detail.html", controller: "TerritoryDetailCtrl", access: { isFree: false } })
			.when("/:territoryId", { templateUrl: "/templates/householder-list.html", controller: "HouseholderListCtrl", access: { isFree: false } })
			.when("/", { templateUrl: "/templates/householder-list.html", controller: "HouseholderListCtrl", access: { isFree: false } })
  			.otherwise({ redirectTo: "/" });

  		$locationProvider.html5Mode(true);
	}]);

