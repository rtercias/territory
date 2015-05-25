"use strict";

angular.module("TerritoryManager.filters", [])
	.filter("iif", function () {
		return function (input, trueValue, falseValue) {
			return input ? trueValue : falseValue;
		};
	});