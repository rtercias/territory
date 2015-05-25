"use strict";

angular.module("TerritoryManager.services", [])
    .factory("shared", ["$rootScope", "$http", "$location", "$cookieStore", "$dialog", "orderByFilter", "authService", function ($rootScope, $http, $location, $cookieStore, $dialog, orderByFilter, authService) {
	    var shared = {};
	    shared.currentUser = new User();
	    shared.currentCongregation = new Congregation();
	    shared.currentTerritory = new Territory();
	    shared.currentHouseholder = new Householder();
	    shared.territories = new Array();
	    shared.householders = new Array();
	    shared.renderMap = false;
	    shared.message;
	    shared.loading = false;
	    shared.config = {};
	    shared.map;
	    shared.markers = [];
	    shared.territoryMarkers = [];
	    shared.shapes = [];
	    shared.showWelcome = false;
	    shared.templates = [];
	    shared.searchResult = new Array();

	    shared.broadcastHouseholders = function (householders) {
		    this.householders = orderByFilter(householders, "SeqNum");
		    $rootScope.$broadcast("broadcastHouseholders");
	    }

	    shared.broadcastTerritories = function (territories) {
		    this.territories = orderByFilter(territories, "TerritoryName");
		    $rootScope.$broadcast("broadcastTerritories");
	    }

	    shared.broadcastCurrentHouseholder = function (h) {
		    this.currentHouseholder = h;
		    $rootScope.$broadcast("broadcastCurrentHouseholder");
	    }

	    shared.broadcastCurrentTerritory = function (t) {
		    this.currentTerritory = t;
		    $rootScope.$broadcast("broadcastCurrentTerritory");
	    }

	    //shared.broadcastMapRendering = function (value) {
		//    this.mapIsRendering = value;
		//    $rootScope.$broadcast("broadcastMapRendering");
	    //}

	    shared.broadcastMessage = function (text, type, context) {
		    if (!text || text=="") {
			    this.message = undefined;
		    } else {
			    this.message = { "text": text, "type": type, "context": context };
		    }
		    $rootScope.$broadcast("broadcastMessage");
	    }

	    shared.broadcastCurrentUser = function (u) {
		    this.currentUser = u;
		    $rootScope.$broadcast("broadcastCurrentUser");
	    }

	    shared.broadcastCurrentCongregation = function (c) {
		    this.currentCongregation = c;
		    $rootScope.$broadcast("broadcastCurrentCongregation");
	    }

	    shared.broadcastLoading = function (l) {
	        this.loading = l;
	        $rootScope.$broadcast("broadcastLoading");
	    }

	    shared.broadcastShowWelcome = function (w) {
	        this.showWelcome = w;
	        $rootScope.$broadcast("broadcastShowWelcome");
	    }

	    shared.broadcastBorders = function (b) {
	        this.borders = b;
	        $rootScope.$broadcast("broadcastBorders");
	    }

	    shared.broadcastSearchResult = function (s) {
	        this.searchResult = s;
	        $rootScope.$broadcast("broadcastSearchResult");
	    }
	    shared.dialog = function (title, mainText, subText) {
	        var opts = {
	            backdrop: true,
	            keyboard: true,
	            backdropClick: true,
	            templateUrl: 'templates/confirm-dialog.html',
	            controller: 'DialogCtrl',
	            title: title,
	            mainText: mainText,
	            subText: subText,
	            confirmLabel: 'OK',
	            cancelLabel: 'Cancel'
	        };

	        console.log(opts);
	        var d = $dialog.dialog(opts);
	        d.open().then(function (result) {
	            if (result) {
	                console.log(result);
	            }
	        });
	    }

	    shared.login = function (callback) {
	        if (!shared.config.headers) {
	            //shared.broadcastMessage("Login credentials are missing or invalid.", "warning", "login");
	            //console.log(shared.message.text);
	            //return false;
	            shared.config.headers = $cookieStore.get("headers");
	        }

	        shared.broadcastMessage("Logging in. Please wait...", "warning", "login");

	        try {
	            shared.loading = true;
	            $http({ method: 'POST', url: urlWebAPI + '/user/login', headers: shared.config.headers })
                    .success(function (data) {
                        shared.currentUser = new User();
                        shared.currentUser.Id = data.Id;
                        shared.currentUser.UserName = data.UserName;
                        shared.currentUser.Password = "";
                        shared.currentUser.LoggedIn = true;
                        shared.currentUser.Agree = true;
                        shared.currentUser.Status = data.Status;

                        if (data.Congregations) {
                            if (shared.currentUser.Congregations == undefined) shared.currentUser.Congregations = [];

                            for (var i = 0; i < data.Congregations.length; i++) {
                                var cong = new Congregation();
                                cong.Id = data.Congregations[i].Id;
                                cong.CongName = data.Congregations[i].CongName;
                                cong.Address = data.Congregations[i].Address;
                                shared.currentUser.Congregations.push(cong);
                            }
                        }

                        if (data.Roles) {
                            if (shared.currentUser.Roles == undefined) shared.currentUser.Roles = [];
                            for (var i = 0; i < data.Roles.length; i++) {
                                shared.currentUser.Roles.push(data.Roles[i].RoleName);
                            }
                        }

                        shared.broadcastCurrentUser(shared.currentUser);
                        authService.loginConfirmed();

                        if (typeof callback == "function") {
                            callback(shared.currentUser);
                        }
                    })
                    .error(function () {
                        console.log("login failed");
                        shared.loading = false;
                        shared.broadcastMessage("Unable to log in. Please check the username or password.", "important", "login");
                    });
	        }
	        catch (err) {
	            console.log(err);
	            shared.loading = false;
	            shared.broadcastMessage("Unable to log in. Username or password is incorrect.", "important", "login");
	        }
	    }

	    shared.logout = function (callback) {
	        shared.loading = true;
	        $http({ method: 'POST', url: urlWebAPI + '/user/logout', headers: shared.config.headers })
	            .success(function() {
	                $cookieStore.remove("headers");
	                shared.currentUser = new User();
	                shared.broadcastCurrentUser(shared.currentUser);
	                shared.broadcastMessage("User logged out.", "success", "login");
	                shared.loading = false;

	                if (typeof callback == "function") {
	                    callback();
	                }

	                setTimeout(function () {
	                    shared.broadcastMessage();
	                }, 5000);
	                
	            });
	        
	    }

        //householder
	    shared.saveHouseholders = function (householders) {
	        shared.broadcastLoading(true);
	        if (shared.currentUser.LoggedIn
            && shared.currentUser.Status == 'Active'
            && (shared.currentUser.Roles.indexOf('Admin') >= 0
	        || shared.currentUser.Roles.indexOf('PowerUser') >= 0)) {
	            $http({ method: 'PUT', url: urlWebAPI + '/householder/savemany', data: householders, headers: shared.config.headers })
                    .success(function () {
                        shared.broadcastLoading(false);
                        shared.broadcastMessage("Save successful.", "success", "main");
                    })
		            .error(function () {
		                shared.broadcastLoading(false);
		                shared.broadcastMessage("Save failed.", "important", "main");
		            });
	        }
	    }

	    shared.saveExistingHouseholder = function (householder) {
	        shared.broadcastLoading(true);
	        if (shared.currentUser.LoggedIn
            && shared.currentUser.Status == 'Active'
            && (shared.currentUser.Roles.indexOf('Admin') >= 0
	        || shared.currentUser.Roles.indexOf('PowerUser') >= 0)) {
	            $http({ method: 'PUT', url: urlWebAPI + '/householder', data: householder, headers: shared.config.headers })
                    .success(function () {
                        shared.broadcastLoading(false);
                        shared.broadcastMessage("Save successful.", "success", "main");
                    })
		            .error(function () {
		                shared.broadcastLoading(false);
		                shared.broadcastMessage("Save failed.", "important", "main");
		            });
	        }
	    }

	    shared.saveNewHouseholder = function (householder) {
	        shared.broadcastLoading(true);
	        if (shared.currentUser.LoggedIn
            && shared.currentUser.Status == 'Active'
            && (shared.currentUser.Roles.indexOf('Admin') >= 0
	        || shared.currentUser.Roles.indexOf('PowerUser') >= 0)) {
	            $http({ method: 'POST', url: urlWebAPI + '/householder', data: householder, headers: shared.config.headers })
                    .success(function () {
                        shared.broadcastLoading(false);
                        shared.broadcastMessage("Save successful.", "success", "main");
                    })
		            .error(function () {
		                shared.broadcastLoading(false);
		                shared.broadcastMessage("Save failed.", "important", "main");
		            });
	        }
	    }

	    shared.doNotCallHouseholder = function (id) {
	        shared.broadcastLoading(true);
	        if (shared.currentUser.LoggedIn
            && shared.currentUser.Status == 'Active'
            && (shared.currentUser.Roles.indexOf('Admin') >= 0
	        || shared.currentUser.Roles.indexOf('PowerUser') >= 0)) {
	            $http({ method: 'PUT', url: urlWebAPI + '/householder/donotcall/' + id, headers: shared.config.headers })
                    .success(function () {
                        shared.broadcastLoading(false);
                        shared.broadcastMessage("Status updated to Do Not Call.", "success", "main");
                    })
		            .error(function () {
		                shared.broadcastLoading(false);
		                shared.broadcastMessage("Status update failed.", "important", "main");
		            });
	        }
	    }

        shared.activateHouseholder = function (id) {
	        shared.broadcastLoading(true);
	        if (shared.currentUser.LoggedIn
            && shared.currentUser.Status == 'Active'
            && (shared.currentUser.Roles.indexOf('Admin') >= 0
	        || shared.currentUser.Roles.indexOf('PowerUser') >= 0)) {
	            $http({ method: 'PUT', url: urlWebAPI + '/householder/activate/' + id, headers: shared.config.headers })
                    .success(function () {
                        shared.broadcastLoading(false);
                        shared.broadcastMessage("Householder activated.", "success", "main");
                    })
		            .error(function () {
		                shared.broadcastLoading(false);
		                shared.broadcastMessage("Status update failed.", "important", "main");
		            });
	        }
        }

        shared.deactivateHouseholder = function (id) {
            shared.broadcastLoading(true);
            if (shared.currentUser.LoggedIn
            && shared.currentUser.Status == 'Active'
            && (shared.currentUser.Roles.indexOf('Admin') >= 0
	        || shared.currentUser.Roles.indexOf('PowerUser') >= 0)) {
                $http({ method: 'PUT', url: urlWebAPI + '/householder/deactivate/' + id, headers: shared.config.headers })
                    .success(function () {
                        shared.broadcastLoading(false);

                        //find id in householders list, and remove
                        for (var i = 0; i < shared.householders.length; i++) {
                            if (shared.householders[i].Id == id) {
                                shared.householders.splice(i, 1);
                            }
                        }

                        shared.broadcastMessage("Householder removed.", "success", "main");
                    })
		            .error(function () {
		                shared.broadcastLoading(false);
		                shared.broadcastMessage("Status update failed.", "important", "main");
		            });
            }
        }

        shared.lockHouseholder = function (id) {
            shared.broadcastLoading(true);
            if (shared.currentUser.LoggedIn
            && shared.currentUser.Status == 'Active'
            && (shared.currentUser.Roles.indexOf('Admin') >= 0
	        || shared.currentUser.Roles.indexOf('PowerUser') >= 0)) {
                $http({ method: 'PUT', url: urlWebAPI + '/householder/lockposition/' + id, headers: shared.config.headers })
                    .success(function () {
                        shared.broadcastLoading(false);
                        shared.broadcastMessage("Householder position locked.", "success", "main");
                    })
		            .error(function () {
		                shared.broadcastLoading(false);
		                shared.broadcastMessage("Householder lock failed.", "important", "main");
		            });
            }
        }

        shared.unlockHouseholder = function (id) {
            shared.broadcastLoading(true);
            if (shared.currentUser.LoggedIn
            && shared.currentUser.Status == 'Active'
            && (shared.currentUser.Roles.indexOf('Admin') >= 0
	        || shared.currentUser.Roles.indexOf('PowerUser') >= 0)) {
                $http({ method: 'PUT', url: urlWebAPI + '/householder/unlockposition/' + id, headers: shared.config.headers })
                    .success(function () {
                        shared.broadcastLoading(false);
                        shared.broadcastMessage("Householder position unlocked.", "success", "main");
                    })
		            .error(function () {
		                shared.broadcastLoading(false);
		                shared.broadcastMessage("Householder unlock failed.", "important", "main");
		            });
            }
        }

        shared.geocodeHouseholder = function (id) {
            shared.broadcastLoading(true);
            if (shared.currentUser.LoggedIn
            && shared.currentUser.Status == 'Active'
            && (shared.currentUser.Roles.indexOf('Admin') >= 0
	        || shared.currentUser.Roles.indexOf('PowerUser') >= 0)) {
                $http({ method: 'PUT', url: urlWebAPI + '/householder/geocode/' + id, headers: shared.config.headers })
                    .success(function () {
                        shared.broadcastLoading(false);
                        shared.broadcastMessage("Householder address geocoded.", "success", "main");
                    })
		            .error(function () {
		                shared.broadcastLoading(false);
		                shared.broadcastMessage("Geocoding failed.", "important", "main");
		            });
            }
        }

        shared.search = function (congId, searchText) {
            shared.broadcastLoading(true);
            shared.searchResult = [];
            shared.broadcastSearchResult(shared.searchResult);
            if (congId) {
                $http({ method: 'GET', url: urlWebAPI + '/householder/search?congid=' + congId + '&text=' + searchText, headers: shared.config.headers })
                    .success(function (data) {
                        if (data) {
                            $.each(data, function (index, h) {
                                var householder = shared.populateHouseholder(h);
                                shared.searchResult.push(householder);
                            });
                        }
                        shared.broadcastSearchResult(shared.searchResult);
                        shared.broadcastLoading(false);

                        if (typeof callback == "function") {
                            callback();
                        }
                    })
		            .error(function () {
		                shared.broadcastLoading(false);
		                shared.broadcastMessage("Save failed.", "important", "main");
		            });
            }
        }

        shared.populateHouseholder = function(h) {
            var householder = new Householder();
            householder.Id = h.Id;
            householder.TerritoryId = h.TerritoryId;
            householder.SeqNum = h.SeqNum;
            householder.Address = h.Address;
            householder.AptNum = h.AptNum;
            householder.City = h.City;
            householder.State = h.State;
            householder.Zip = h.Zip;
            householder.Country = h.Country;
            householder.Location = h.Location;
            householder.IsDoNotCall = h.IsDoNotCall;
            householder.Telephone = h.Telephone;
            householder.Notes = h.Notes;

            return householder;
        }

        //territory 
        shared.saveExistingTerritory = function (territory) {
            shared.broadcastLoading(true);
            if (shared.currentUser.LoggedIn
            && shared.currentUser.Status == 'Active'
            && (shared.currentUser.Roles.indexOf('Admin') >= 0
	        || shared.currentUser.Roles.indexOf('PowerUser') >= 0)) {
                $http({ method: 'PUT', url: urlWebAPI + '/territory', data: territory, headers: shared.config.headers })
                    .success(function () {
                        shared.getTerritories(territory.CongId, function () {
                            shared.broadcastCurrentTerritory(territory);
                            shared.broadcastTerritories(shared.territories);
                            shared.broadcastLoading(false);
                            shared.broadcastMessage("Save successful.", "success", "main");
                        });
                    })
		            .error(function () {
		                shared.broadcastLoading(false);
		                shared.broadcastMessage("Save failed.", "important", "main");
		            });
            }
        }

        shared.saveNewTerritory = function (territory) {
            shared.broadcastLoading(true);
            if (shared.currentUser.LoggedIn
            && shared.currentUser.Status == 'Active'
            && (shared.currentUser.Roles.indexOf('Admin') >= 0
	        || shared.currentUser.Roles.indexOf('PowerUser') >= 0)) {
                //for now, unitId will be set to 1, until such a time when service groups are supported
                territory.UnitId = 1;
                $http({ method: 'POST', url: urlWebAPI + '/territory', data: territory, headers: shared.config.headers })
                    .success(function () {
                        //retrieve new territory
                        shared.getTerritoryByName(territory.TerritoryName);
                        shared.getTerritories(territory.CongId, function () {
                            shared.broadcastTerritories(shared.territories);
                            shared.broadcastLoading(false);
                            shared.broadcastMessage("Save successful.", "success", "main");
                        });
                    })
		            .error(function () {
		                shared.broadcastLoading(false);
		                shared.broadcastMessage("Save failed.", "important", "main");
		            });
            }
        }

        shared.getTerritory = function (terrId) {
            if (terrId) {
                $http({ method: 'GET', url: urlWebAPI + '/territory?id=' + terrId, headers: shared.config.headers })
                    .success(function (data) {
                        var terr = shared.populateTerritory(data);
                        shared.broadcastCurrentTerritory(terr);
                    });
            }
        }

        shared.getTerritoryByName = function (name, callback) {
            if (name) {
                $http({ method: 'GET', url: urlWebAPI + '/territory/byname?name=' + name, headers: shared.config.headers })
                    .success(function (data) {
                        var terr = shared.populateTerritory(data);
                        shared.currentTerritory = terr;
                        shared.broadcastCurrentTerritory(terr);

                        if (typeof callback == "function") {
                            callback();
                        }
                    });
            }
        }

        shared.getTerritories = function (congId, callback) {
            shared.territories = [];
            shared.broadcastTerritories(shared.territories);
            if (congId) {
                $http({ method: 'GET', url: urlWebAPI + '/territory/bycongid/' + congId, headers: shared.config.headers })
                    .success(function (data) {
                        if (data) {
                            $.each(data, function (index, t) {
                                var terr = shared.populateTerritory(t);
                                shared.territories.push(terr);
                            });
                        }
                        shared.broadcastTerritories(shared.territories);
                        shared.broadcastLoading(false);

                        if (typeof callback == "function") {
                            callback();
                        }
                    })
		            .error(function () {
		                shared.broadcastLoading(false);
		                shared.broadcastMessage("Save failed.", "important", "main");
		            });
            }
        }

        shared.populateTerritory = function (data) {
            var terr = new Territory();
            if (data) {
                terr.Id = data.Id;
                terr.TerritoryName = data.TerritoryName;
                terr.MiddleLocation = data.MiddleLocation;
                terr.TerritoryType = data.TerritoryType;
                terr.UnitId = data.UnitId;
                terr.CongId = data.CongId;
                terr.Notes = data.Notes;
                terr.HouseholderCount = data.HouseholderCount;
                terr.Borders = data.Borders;
            }
            return terr;
        }

	    return shared;
    }])
;