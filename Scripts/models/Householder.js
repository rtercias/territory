function Householder() {
    this.Id = 0;
    this.TerritoryId;
    this.TerritoryName;
    this.SeqNum = 0;
    this.FirstName = "";
    this.LastName = "";
    this.Address = "";
    this.AptNum = "";
    this.CityStateZip = 0;
    this.City = "";
    this.State = "";
    this.Zip = "";
    this.Country = "";
    this.Telephone = "";
    this.Notes = "";
    this.ApartmentComplex = "";
    this.Location = "";
    this.IsLocked = false;
    this.MessageType = "";
    this.Message = "";
    this.IsDoNotCall = false;
    this.IsActive = false;
}



Householder.prototype.move = function (newRow, newTerritoryId) {
    this.seqNum = newRow;
    if (newTerritoryId && Territory.exists(newTerritoryId)) {
        this.territoryId = newTerritoryId;
    }
}

//save new or existing householder
Householder.prototype.save = function () {
    var jsonData = ko.toJSON(this);

    $.post(
        urlWebAPI + "/api/householder", jsonData
    )
    .done(function () {
        //add message
    })
    .fail(function () {
        //add message
    });
}

//delete householder
Householder.prototype.delete = function (id) {
    if (id) {
        $.ajax({
            url: urlWebAPI + "/api/householder/" + id,
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


//begin static methods

//get one householder by name or id
Householder.get = function (id) {
	var householder = new Householder();

    householder.Id = id;
    householder.TerritoryId =
		id == 1 ? 1 :
		id == 2 ? 1 :
		id == 3 ? 1 :
		id == 4 ? 1 :
		id == 5 ? 1 :
		id == 6 ? 1 :
		id == 7 ? 1 :
		id == 8 ? 1 :
		id == 9 ? 2 :
		id == 10 ? 2 :
		id == 11 ? 2 :
		id == 12 ? 2 :
		id == 13 ? 2 :
		id == 14 ? 2 :
		id == 15 ? 2 : 2;
    householder.SeqNum =
		id == 1 ? 7 :
		id == 2 ? 4 :
		id == 3 ? 3 :
		id == 4 ? 2 :
		id == 5 ? 1 :
		id == 6 ? 6 :
		id == 7 ? 5 :
		id == 8 ? 8 :
		id == 9 ? 1 :
		id == 10 ? 2 :
		id == 11 ? 4 :
		id == 12 ? 3 :
		id == 13 ? 7 :
		id == 14 ? 5 :
		id == 15 ? 6 : 0;
    householder.FirstName =
		id == 1 ? "" :
		id == 2 ? "Mir" :
		id == 3 ? "Sunga" :
		id == 4 ? "Erica" :
		id == 5 ? "Ernie" :
		id == 6 ? "Dennis & Clarice" :
		id == 7 ? "Santiago" :
		id == 8 ? "" :
		id == 9 ? "June And Maria Fe " :
		id == 10 ? "Jonathan" :
		id == 11 ? "Ric & Lita" :
		id == 12 ? "Randy" :
		id == 13 ? "" :
		id == 14 ? "Ida" :
		id == 15 ? "Tony" : "";
    householder.LastName =
		id == 1 ? "" :
		id == 2 ? "Soriano" :
		id == 3 ? "" :
		id == 4 ? "Sicat" :
		id == 5 ? "" :
		id == 6 ? "Cabahug" :
		id == 7 ? "" :
		id == 8 ? "" :
		id == 9 ? "Oasan" :
		id == 10 ? "Navaro" :
		id == 11 ? "Panganiban" :
		id == 12 ? "Garcia" :
		id == 13 ? "" :
		id == 14 ? "" :
		id == 15 ? "Obidos" : "";

    householder.Address =
		id == 1 ? "469 South Pearl St." :
		id == 2 ? "492 Catherine St." :
		id == 3 ? "24 Raymo St." :
		id == 4 ? "94 Kenosha St." :
		id == 5 ? "19 Bohl Ave." :
		id == 6 ? "25 Marinello Terr." :
		id == 7 ? "49 Summit Ave." :
		id == 8 ? "80 Hackett Blvd." :
		id == 9 ? "70 Hackett Blvd." :
		id == 10 ? "17 Marinello Terr." :
		id == 11 ? "49 Summit Ave." :
		id == 12 ? "100 Catherine St." :
		id == 13 ? "99 South Pearl St." :
		id == 14 ? "669 South Pearl St." :
		id == 15 ? "300 South Pearl St." :
		id == 16 ? "5 Kenosha St." :
		id == 17 ? "3 Catherine St." :
		id == 18 ? "1000 Raymo St." :
		id == 19 ? "200 Kenosha St." :
		id == 20 ? "250 Bohl Ave." :
		id == 21 ? "2500 Marinello Terr." :
		id == 22 ? "220 Summit Ave." :
		id == 23 ? "800 Hackett Blvd." :
		id == 24 ? "700 Hackett Blvd." : "";

	householder.AptNum =
		id == 1 ? "1F" :
		id == 2 ? "Apt. 3" :
		id == 3 ? "" :
		id == 4 ? "" :
		id == 5 ? "" :
		id == 6 ? "" :
		id == 7 ? "Apt. 1F" :
		id == 8 ? "" :
		id == 9 ? "" :
		id == 10 ? "" :
		id == 11 ? "Apt. 2F" :
		id == 12 ? "Apt. 1" :
		id == 13 ? "" :
		id == 14 ? "2F" :
		id == 15 ? "3F" : "";
    householder.ApartmentComplex =
		id == 1 ? "" :
		id == 2 ? "" :
		id == 3 ? "" :
		id == 4 ? "" :
		id == 5 ? "" :
		id == 6 ? "" :
		id == 7 ? "" :
		id == 8 ? "" :
		id == 9 ? "" :
		id == 10 ? "" :
		id == 11 ? "" :
		id == 12 ? "" :
		id == 13 ? "" :
		id == 14 ? "" :
		id == 15 ? "" : "";
    householder.CityStateZip =
		id == 1 ? "Albany, NY 12202" :
		id == 2 ? "Albany, NY 12209" :
		id == 3 ? "Albany, NY 12209" :
		id == 4 ? "Albany, NY 12209" :
		id == 5 ? "Albany, NY 12209" :
		id == 6 ? "Albany, NY 12209" :
		id == 7 ? "Albany, NY 12209" :
		id == 8 ? "Albany, NY 12208" :
		id == 9 ? "Albany, NY 12208" :
		id == 10 ? "Albany, NY 12209" :
		id == 11 ? "Albany, NY 12209" :
		id == 12 ? "Albany, NY 12209" :
		id == 13 ? "Albany, NY 12207" :
		id == 14 ? "Albany, NY 12202" :
		id == 15 ? "Albany, NY 12202" : "Albany, NY 12209";
    householder.City =
		id == 1 ? "Albany" :
		id == 2 ? "Albany" :
		id == 3 ? "Albany" :
		id == 4 ? "Albany" :
		id == 5 ? "Albany" :
		id == 6 ? "Albany" :
		id == 7 ? "Albany" :
		id == 8 ? "Albany" :
		id == 9 ? "Albany" :
		id == 10 ? "Albany" :
		id == 11 ? "Albany" :
		id == 12 ? "Albany" :
		id == 13 ? "Albany" :
		id == 14 ? "Albany" :
		id == 15 ? "Albany" : "Albany";
    householder.State =
		id == 1 ? "NY" :
		id == 2 ? "NY" :
		id == 3 ? "NY" :
		id == 4 ? "NY" :
		id == 5 ? "NY" :
		id == 6 ? "NY" :
		id == 7 ? "NY" :
		id == 8 ? "NY" :
		id == 9 ? "NY" :
		id == 10 ? "NY" :
		id == 11 ? "NY" :
		id == 12 ? "NY" :
		id == 13 ? "NY" :
		id == 14 ? "NY" :
		id == 15 ? "NY" : "NY";
    householder.Zip =
		id == 1 ? "12202" :
		id == 2 ? "12209" :
		id == 3 ? "12209" :
		id == 4 ? "12209" :
		id == 5 ? "12209" :
		id == 6 ? "12209" :
		id == 7 ? "12209" :
		id == 8 ? "12208" :
		id == 9 ? "12208" :
		id == 10 ? "12209" :
		id == 11 ? "12209" :
		id == 12 ? "12209" :
		id == 13 ? "12207" :
		id == 14 ? "12202" :
		id == 15 ? "12202" : "12209";
    householder.Telephone = 
		id == 1 ? "" :
		id == 2 ? "" :
		id == 3 ? "" :
		id == 4 ? "" :
		id == 5 ? "" :
		id == 6 ? "" :
		id == 7 ? "" :
		id == 8 ? "" :
		id == 9 ? "" :
		id == 10 ? "" :
		id == 11 ? "" :
		id == 12 ? "" :
		id == 13 ? "" :
		id == 14 ? "" :
		id == 15 ? "" : "";
    householder.Notes = 
		id == 1 ? "" :
		id == 2 ? "" :
		id == 3 ? "" :
		id == 4 ? "" :
		id == 5 ? "" :
		id == 6 ? "" :
		id == 7 ? "" :
		id == 8 ? "" :
		id == 9 ? "" :
		id == 10 ? "Visit In Early Evening" :
		id == 11 ? "" :
		id == 12 ? "" :
		id == 13 ? "" :
		id == 14 ? "" :
		id == 15 ? "" : "";
    householder.Country = "USA";
    return householder;
}

//do search
Householder.search = function (searchString) {
}



//end static methods