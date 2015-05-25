var myApp = angular.module("Territory", []);
var injector = angular.injector(["ng", "Territory"]);
var init = {
	setup: function () {
		this.$scope = injector.get("$rootScope").$new();
	}
};

module("territoryControllerTests", init);
test("getTerritoryHouseholders", function () {
	var $controller = injector.get("$controller");
	$controller("getTerritoryHouseholders", {
		$scope: this.$scope
	});
	ok(this.$scope.territory.Householders instanceof HouseholderArray, "Householders is an instance of HouseholderArray.");
	ok(this.$scope.territory.Householders.length > 0, "Householders is not empty.");
});

test("getTerritories", function () {
	var $controller = injector.get("$controller");
	$controller("getTerritories", {
		$scope: this.$scope
	});
	ok(this.$scope.territories instanceof TerritoryArray, "Territories is an instance of TerritoryArray.");
	ok(this.$scope.territories.length > 0, "Territories is not empty.");
});

module("householderControllerTests", init);