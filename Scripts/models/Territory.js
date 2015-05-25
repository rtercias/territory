function Territory() {
	this.Id = 0;
	this.TerritoryName = "";
	this.MiddleLocation = "";
	this.TerritoryType = "";
	this.UnitId = 0;
	this.CongId = 0;
	this.Notes = "";
	this.HouseholderCount = 0;
	this.Selected = false;
	this.Borders = "";
}  
Territory.prototype.Householders = new Array();

//save new or existing territory
Territory.prototype.save = function () {
    var jsonData = ko.toJSON(this);

    $.post(
        urlWebAPI + "/api/territory", jsonData
    )
    .done(function () {
        //add message
    })
    .fail(function () {
        //add message
    });
}

//delete territory
Territory.prototype.delete = function (id) {
    if (id) {
        $.ajax({
            url: urlWebAPI + "/api/territory/" + id,
            type: 'DELETE'
        })
        .done(function () {
            //add message
        })
        .fail(function () {
            //add message
        });
    }
}

//plot territory addresses in a google map
Territory.prototype.plot = function () {
}

//call printer-friendly rendition of territory
Territory.prototype.print = function (includeMap) {

}

//optimize a territory's address list
Territory.prototype.optimize = function (startingAddress) {
}

//begin static methods

//get one territory by name or id
Territory.get = function (id, name, address) {
	var territory = new Territory();
	territory.Id = id;
	territory.TerritoryName = name;
	territory.MiddleLocation = address;
	return territory;

	//$.getJSON(
    //    urlWebAPI + "/api/territory/" + nameOrId
    //)
    //.done(function (data) {
    //	var territory = new Territory();
    //	territory = ko.mapping.fromJS(data);
    //	//ko.applyBindings(territory);
    //	return territory;
    //})
    //.fail(function () {
    //	//add message
    //});
}



//check if a territory id is valid
Territory.exists = function (territoryId) {
    
}

//end static methods