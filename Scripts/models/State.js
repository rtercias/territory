function State() {
	this.StateCode = "";
	this.StateName = "";
}

State.get = function (code, name) {
	var state = new State();
	state.StateCode = code;
	state.StateName = name;
	return state;
}