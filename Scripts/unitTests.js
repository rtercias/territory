function territoryTests() {
	var t = new Territory();
	var h = new Householder();
	t.Householders.push(h);

	test("territory.Householders", function () {
		ok(t.Householders instanceof HouseholderArray, "Householders is an instance of HouseholderArray.");
		ok(t.Householders.length > 0, "Householders is not empty.");
	});
}