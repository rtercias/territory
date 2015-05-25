"use strict";

angular.module("TerritoryManager.controllers", []).controller("MainCtrl", ["$scope", "$dialog", "$route", "$location", "$routeParams", "$http", "$cookieStore", "shared", "orderByFilter", "authService", function ($scope, $dialog, $route, $location, $routeParams, $http, $cookieStore, shared, orderByFilter, authService) {
	var geocoder, tsp;
	var mode;
	var avoidHighways = false; // Whether to avoid highways. False by default.
	var waypoints = new Array();
	var addresses = new Array();
	var labels = new Array();
	var addr = new Array();
	var numDirectionsComputed = 0;
	var numDirectionsNeeded = 0;

	$scope.publicContent = [];
	$scope.restrictedContent = [];

	$scope.stopRendering = false;

	$scope.$on('event:auth-loginRequired', function () {
	    $location.path("/");
	    shared.broadcastMessage("Unable to log in. Please check the username or password.", "important", "login");
	});
	$scope.$on('event:auth-loginConfirmed', function () {
	    $cookieStore.put("headers", shared.config.headers);
	    shared.broadcastMessage("Welcome back!", "success", "login");
	});

	$scope.$on("broadcastCurrentUser", function () {
	    $scope.user = shared.currentUser;
	    if ($scope.user.LoggedIn) {
	        $scope.loginText = "Logged in: " + $scope.user.UserName;
	        if ($scope.user.Status != "Pending" && $scope.user.Congregations.length > 0) {
	            $scope.congId = $scope.user.CongId;
	            $scope.congregation = $scope.user.Congregations[0];
	            shared.broadcastCurrentCongregation($scope.congregation);
	        }
	        shared.broadcastMessage();
	    }
	    else {
	        $scope.loginText = "Log in";
	        shared.broadcastMessage();
	        $scope.congId = 0;
	        $scope.congregation = new Congregation();
	        shared.broadcastCurrentCongregation($scope.congregation);
	        $scope.territory = new Territory();
	        shared.broadcastCurrentTerritory($scope.territory);
	    }
	});

	$scope.$on("broadcastCurrentCongregation", function () {
	    if ($scope.user.LoggedIn && $scope.user.Status != "Pending") {
	        $scope.congregation = shared.currentCongregation;
	        $scope.startingAddress = shared.currentCongregation.Address;
	        $scope.KHAddress = shared.currentCongregation.Address;
	        //$scope.KHLocation;
	        $scope.getFirstTerritory($scope.congregation.Id);
	        $scope.getTerritories($scope.congregation.Id);
	    }
	});

	$scope.$on("broadcastTerritories", function () {
	    $scope.territories = shared.territories;
	});

	$scope.$on("broadcastHouseholders", function () {
	    $scope.householders = shared.householders;
	    shared.showWelcome = false;
	    if (tsp && !$scope.skipRedraw && $scope.autoRender) {

	        //$scope.initMap();
	        //$scope.drawHouseholderMarkers(true);
	    }
	});

	$scope.$on("broadcastCurrentTerritory", function () {
	    $scope.territory = shared.currentTerritory;
	    if ($scope.user.LoggedIn && $scope.user.Status != "Pending" && $scope.territory) {
	        $scope.getHouseholders($scope.territory.Id);
	    }
	});

	$scope.$on("broadcastMapRendering", function () {
	    //
	});

	$scope.$on("broadcastMessage", function () {
	    if (shared.message) {
	        if (shared.message.context == "main") {
	            $scope.messages = [shared.message];
	        }
	        else if (shared.message.context == "login") {
	            $scope.loginMessages = [shared.message];
	        }
	    }
	    else {
	        $scope.messages = [];
	        $scope.loginMessages = [];
	    }
	});

	$scope.$on("broadcastLoading", function () {
	    $scope.loading = shared.loading;
	});

	$scope.loginText = "Log in";

	$scope.login = function () {
	    //set up config for api calls. this will be re-used throughout the current session
	    //if (!shared.config.headers) {
	    shared.config.headers = { Authorization: "Basic " + Base64.encode($scope.user.UserName + ":" + $scope.user.Password) };
	    //}
	    shared.login(function () {
	        shared.broadcastShowWelcome(false);
	    });
	    ////set up config for api calls. this will be re-used throughout the current session
	    //$scope.config = {
	    //    headers: $scope.config.headers == undefined
	    //             ? { Authorization: "Basic " + Base64.encode($scope.user.UserName + ":" + $scope.user.Password) }
	    //             : $scope.config.headers
	    //};

	    //$scope.loading = true;
	    //shared.broadcastMessage("Logging in. Please wait...", "warning", "login");

	    //try {
	    //    $http({ method: 'POST', url: urlWebAPI + '/user/login', headers: $scope.config.headers })
	    //        .success(function (data) {
	    //            $scope.user = new User();
	    //            $scope.user.Id = data.Id;
	    //            $scope.user.UserName = data.UserName;
	    //            $scope.user.Password = "";
	    //            $scope.user.LoggedIn = true;
	    //            $scope.user.Agree = true;
	    //            $scope.user.Status = data.Status

	    //            if (data.Congregations) {
	    //                if ($scope.user.Congregations == undefined) $scope.user.Congregations = [];

	    //                for (var i = 0; i < data.Congregations.length; i++) {
	    //                    var cong = new Congregation();
	    //                    cong.Id = data.Congregations[i].Id;
	    //                    cong.CongName = data.Congregations[i].CongName;
	    //                    cong.Address = data.Congregations[i].Address;
	    //                    $scope.user.Congregations.push(cong);
	    //                }
	    //            }

	    //            if (data.Roles) {
	    //                if ($scope.user.Roles == undefined) $scope.user.Roles = [];
	    //                for (var i = 0; i < data.Roles.length; i++) {
	    //                    $scope.user.Roles.push(data.Roles[i].RoleName);
	    //                }
	    //            }

	    //            shared.broadcastCurrentUser($scope.user);
	    //            shared.broadcastMessage("Welcome back!", "success", "login");
	    //            authService.loginConfirmed();
	    //            //$scope.loading = false;
	    //        })
	    //        .error(function () {
	    //            $scope.loading = false;
	    //            shared.broadcastMessage("Unable to log in. Please check the username or password.", "important", "login");
	    //        });
	    //}
	    //catch (err) {
	    //    console.log(err);
	    //    shared.broadcastMessage("Unable to log in. Username or password is incorrect.", "important", "login");
	    //}
	}

	$scope.logout = function () {
	    shared.logout(function () {
	        $scope.stopRendering = true;
	        shared.broadcastLoading(false);
	        $scope.householders = [];
	        $scope.territory = new Territory();
	        shared.showWelcome = true;
	        if (!$scope.$$phase) {
	            $scope.$apply();
	        }
	    });
	}

	$scope.getAllCongregations = function () {
	    $scope.loading = true;
	    if ($scope.user.Congregations.length > 0) {
	        $http({ method: 'GET', url: urlWebAPI + '/cong/get/', headers: shared.config.headers })
                .success(function (congData) {
                    if (congData) {
                        $.each(congData, function (index, c) {
                            var cong = new Congregation();
                            cong.Id = c.Id;
                            cong.CongName = c.CongName;
                            cong.Address = c.Address;
                            $scope.congregations.push(cong);
                        });
                    }
                    $scope.loading = false;
                })
		        .error(function () {
		            $scope.loading = false;
		        });
	    }
	}

	$scope.getFirstTerritory = function (congId) {
	    $scope.loading = true;
	    if (congId) {
	        $http({ method: 'GET', url: urlWebAPI + '/territory/getfirst?congId=' + congId, headers: shared.config.headers })
                .success(function (data) {
                    var terr = new Territory();
                    terr.Id = data.Id;
                    terr.TerritoryName = data.TerritoryName;
                    terr.MostCommonAddress = data.MostCommonAddress;
                    terr.TerritoryType = data.TerritoryType;

                    //broadcast immediately
                    $scope.territory = terr;
                    shared.broadcastCurrentTerritory($scope.territory);
                });
	    }
	}

	$scope.getTerritories = function (congId) {
	    $scope.loading = true;
	    $scope.territories = [];
	    if (congId) {
	        $http({ method: 'GET', url: urlWebAPI + '/territory/getbycongid?congId=' + congId, headers: shared.config.headers })
                .success(function (data) {
                    if (data) {
                        $.each(data, function (index, t) {
                            var terr = new Territory();
                            terr.Id = t.Id;
                            terr.TerritoryName = t.TerritoryName;
                            terr.MostCommonAddress = t.MostCommonAddress;
                            terr.TerritoryType = t.TerritoryType;
                            $scope.territories.push(terr);
                        });
                    }

                    shared.broadcastTerritories($scope.territories);


                    $scope.loading = false;
                })
		        .error(function () {
		            $scope.loading = false;
		        });
	    }
	}

	$scope.getHouseholders = function (terrId) {
	    $scope.loading = true;
	    $scope.householders = [];
	    if (terrId) {
	        $http({ method: 'GET', url: urlWebAPI + '/householder/getbyterr?terrId=' + terrId, headers: shared.config.headers })
                .success(function (data) {
                    if (data) {
                        $.each(data, function (index, h) {
                            var householder = new Householder();
                            householder.Id = h.Id;
                            householder.TerritoryId = h.TerritoryId;
                            householder.SeqNum = h.SeqNum;
                            householder.FirstName = h.FirstName;
                            householder.LastName = h.LastName;
                            householder.Address = h.Address;
                            householder.AptNum = h.AptNum;
                            householder.City = h.City;
                            householder.State = h.State;
                            householder.Zip = h.Zip;
                            householder.Country = h.Country;
                            householder.Telephone = h.Telephone;
                            householder.Notes = h.Notes;
                            householder.ApartmentComplex = h.ApartmentComplex;
                            householder.Location = h.Location;
                            householder.IsLocked = h.IsLocked;
                            $scope.householders.push(householder);
                        });
                    }
                    shared.broadcastHouseholders($scope.householders);
                    $scope.initMap();
                })
		        .error(function () {
		            $scope.loading = false;
		        });
	    }
	}


	$scope.closeMessage = function (index) {
	    $scope.messages.splice(index, 1);
	};

	$scope.closeLoginMessage = function (index) {
	    $scope.loginMessages.splice(index, 1);
	};

	$scope.progress = 0;
	$scope.max = 100;
	$scope.autoRender = true;
	$scope.showTerritories = false;
	$scope.showTerritoriesText = "Show Territories";
	$scope.showHouseholders = true;
	$scope.showHouseholdersText = "Hide Addresses";
	$scope.showAllAddresses = false;
	$scope.showAllAddressesText = "Show All Addresses";


	//$scope.createNewTerritory = function () {
	//	var territory = new Territory();
	//	shared.broadcastCurrentTerritory($scope.territory);
	//}

	//$scope.createNewTerritory = function (hash) {
	//	$location.path(hash);
	//}

	//$scope.myMarkers = [];

	$scope.initMap = function () {
	    if (tsp) tsp.startOver();
	    shared.broadcastMapRendering(false);
	    $scope.messages = [];
	    geocoder = new google.maps.Geocoder();
	    geocoder.geocode({ 'address': $scope.startingAddress }, function (results, status) {
	        if (status == google.maps.GeocoderStatus.OK) {
	            $scope.startingLocation = results[0].geometry.location;
	            $scope.KHLocation = results[0].geometry.location;
	            var myOptions = {
	                zoom: $scope.defaultZoom,
	                center: results[0].geometry.location,
	                mapTypeId: google.maps.MapTypeId.ROADMAP,
	                disableDefaultUI: true,
	                zoomControl: true,
	                zoomControlOptions: {
	                    style: google.maps.ZoomControlStyle.SMALL
	                }
	            }

	            shared.map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
	            if (!tsp) tsp = new BpTspSolver(shared.map, document.getElementById("directions"));

	            //google.maps.event.addListenerOnce(map, 'idle', function () {
	            $scope.drawHouseholderMarkers(true);
	            google.maps.event.addListener(shared.map, 'zoom_changed', function () {
	                $scope.reStyleByZoom(shared.map.getZoom());
	            });

	            google.maps.event.addListener(tsp.getGDirectionsService(), "error", function () {
	                console.log("Request failed: " + reasons[tsp.getGDirectionsService().getStatus().code]);
	            });

	            //});
	        }
	    });
	}

	$scope.reStyleByZoom = function (zoomLevel) {
	    switch (zoomLevel) {
	        //zoomed in
	        default: case 21: case 20: case 19: case 18:
	        case 17: case 16: case 15: case 14: case 13: {
	            if (!$scope.showHouseholders) {
	                $scope.drawHouseholderMarkers(false);
	                $scope.drawKingdomHallMarker($scope.KHLocation, $scope.KHAddress);
	            }
	            $(".householder-marker").css("font-size", "55px");
	            $(".householder-marker .inner").css({
	                fontSize: "14px",
	                padding: "24px"
	            });
	            $(".territory-marker").css("border-width", "20px");
	            $(".territory-marker .inner").css({
	                fontSize: "14px",
	                padding: "28px 10px"
	            });
	            break;
	        }
	        case 12: {
	            if (!$scope.showHouseholders) {
	                $scope.drawHouseholderMarkers(false);
	                $scope.drawKingdomHallMarker($scope.KHLocation, $scope.KHAddress);
	            }
	            $(".householder-marker").css("font-size", "34px");
	            $(".householder-marker .inner").css({
	                fontSize: "8px",
	                padding: "17px"
	            });
	            $(".territory-marker").css("border-width", "20px");
	            $(".territory-marker .inner").css({
	                fontSize: "14px",
	                padding: "28px 10px"
	            });
	        }

	        case 11: case 10: {
	            if (!$scope.showHouseholders) {
	                $scope.drawHouseholderMarkers(false);
	                $scope.drawKingdomHallMarker($scope.KHLocation, $scope.KHAddress);
	            }
	            $(".householder-marker").css("font-size", "34px");
	            $(".householder-marker .inner").css({
	                fontSize: "8px",
	                padding: "17px"
	            });
	            $(".territory-marker").css("border-width", "10px");
	            $(".territory-marker .inner").css({
	                fontSize: "10px",
	                padding: "15px 5px"
	            });
	            break;
	        }
	        case 9: case 8: case 7: case 6: {
	            if ($scope.showHouseholders) {
	                $scope.removeHouseholderMarkers();
	                $scope.removeKingdomHallMarker();
	            }
	            $(".territory-marker").css("border-width", "5px");
	            $(".territory-marker .inner").css({
	                fontSize: "5px",
	                padding: "2px"
	            });
	            break;
	        }
	        case 5: case 4: case 3: case 2: case 1: {
	            if ($scope.showHouseholders) {
	                $scope.removeHouseholderMarkers();
	                $scope.removeKingdomHallMarker();
	            }
	            $(".territory-marker").css("border-width", "1px");
	            $(".territory-marker .inner").text("").css({
	                fontSize: "0px",
	                padding: "5px"
	            });
	            break;
	        }
	            //zoomed out
	    }
	}

	$scope.skipRedraw = false;

	$scope.drawHouseholderMarkers = function (setViewport) {
	    shared.broadcastMapRendering(true);

	    $scope.removeHouseholderMarkers();
	    $scope.showHouseholdersText = "Hide Householders";
	    $scope.showHouseholders = true;

	    $(".progress .bar").hide().width("0%").show();

	    if ($scope.user && $scope.user.LoggedIn && $scope.user.Status != "Pending") {
	        $scope.KHAddress = $scope.congregation ? $scope.congregation.Address : "";
	        $scope.drawKingdomHallMarker($scope.KHLocation, $scope.KHAddress);
	        tsp.addAddress($scope.startingAddress);
	    }

	    if (!$scope.householders) return false;
	    var l = $scope.householders ? $scope.householders.length : 0;
	    if (l == 0) shared.broadcastMapRendering(false);

	    for (var i = 0; i < l; i++) {
	        //if ($scope.stopRendering) {
	        //	$scope.removeHouseholderMarkers();
	        //	shared.broadcastMapRendering(false);
	        //	$scope.stopRendering = false;
	        //	break;
	        //}

	        var addr =
                $scope.householders[i].Address + " "
                + $scope.householders[i].AptNum + " "
                + $scope.householders[i].City + " "
                + $scope.householders[i].State + " "
                + $scope.householders[i].Zip;

	        var label = $scope.householders[i].SeqNum;
	        var hhId = $scope.householders[i].Id;
	        tsp.addAddressWithLabel(addr, label, hhId, function (a, latlng, lbl, id) {
	            if ($scope.stopRendering) {
	                $scope.removeOldMarkers();
	                setTimeout(function () {
	                    $scope.stopRendering = false;
	                    shared.broadcastLoading(false);
	                }, 5000);
	            }
	            else {
	                var w = tsp.getWaypoints();
	                if (w.length > (l + 1)) {
	                    console.log("Too many requests at the same time.");
	                    return false;
	                }

	                shared.broadcastMapRendering(true);
	                $scope.drawHouseholderMarker(latlng, addr, lbl, id);

	                if (setViewport) {
	                    $scope.setViewportToCover(w.slice(1));
	                }

	                $scope.progress = Math.floor(100 * w.length / (l + 1));
	                $(".progress .bar").width($scope.progress + "%");

	                setTimeout(function () {
	                    shared.broadcastMapRendering(false);
	                    $scope.loading = false;
	                    //setTimeout($scope.messages = [], 20000);
	                }, 5000);
	            }
	        });
	    }
	};

	$scope.showHouseholderDetail = function (id) {
	    $location.path("edithouseholder/" + id);
	};

	$scope.drawHouseholderMarker = function (latlng, addr, label, id) {
	    var sId = id ? id.toString() : "";

	    var marker = new RichMarker({
	        type: "householder",
	        position: latlng,
	        map: shared.map,
	        draggable: false,
	        flat: true,
	        content: '<a class="householder-marker icon-home" href="edithouseholder/' + sId + '"><div class="inner">' + pad(label, 2) + '</div></a>'
	    });

	    shared.markers.push(marker);
	    $scope.$apply();
	}

	$scope.removeOldMarkers = function () {
	    for (var i = 0; i < shared.markers.length; ++i) {
	        shared.markers[i].setMap(null);
	    }
	    shared.markers = [];
	    //$scope.drawKingdomHallMarker($scope.KHLocation, $scope.KHAddress);
	};

	$scope.drawKingdomHallMarker = function (latlng) {
	    var marker = new RichMarker({
	        type: "kingdomHall",
	        position: latlng,
	        map: shared.map,
	        draggable: false,
	        flat: true,
	        content: '<div class="kh-marker label label-warning">Kingdom Hall</div>'
	    });
	    shared.markers.push(marker);
	};

	$scope.removeKingdomHallMarker = function () {
	    for (var i = 0; i < shared.markers.length; i++) {
	        if (shared.markers[i].type == "kingdomHall") {
	            shared.markers[i].setMap(null);
	        }
	    }
	};

	$scope.drawTerritoryMarkers = function () {
	    $scope.showTerritoriesText = "Hide Territories";
	    $scope.showTerritories = true;
	    $(".progress .bar").hide().width("0%").show();

	    var l = $scope.territories.length;
	    for (var i = 0; i < l; i++) {
	        $scope.drawTerritoryMarker($scope.territories[i].TerritoryName, $scope.territories[i].MostCommonAddress, i, l - 1);
	    }
	};

	$scope.drawTerritoryMarker = function (territoryName, address, i, l) {
	    geocoder.geocode({ 'address': address }, function (results, status) {
	        if (status == google.maps.GeocoderStatus.OK) {
	            $scope.progress = Math.floor(100 * i / l);
	            $(".progress .bar").width($scope.progress + "%");

	            var loc = results[0].geometry.location;

	            var marker = new RichMarker({
	                type: "territory",
	                position: loc,
	                map: shared.map,
	                draggable: false,
	                flat: true,
	                content: '<div class="territory-marker"><div class="inner">' + territoryName + '</div></div>'
	            });
	            shared.markers.push(marker);
	        }
	        else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
	            setTimeout(function () {
	                $scope.drawTerritoryMarker(territoryName, address, i, l);
	            }, 100);
	        }
	    });
	};

	$scope.removeTerritoryMarkers = function () {
	    $scope.showTerritoriesText = "Show Territories";
	    $scope.showTerritories = false;
	    for (var i = 0; i < shared.markers.length; i++) {
	        if (shared.markers[i].type == "territory") {
	            shared.markers[i].setMap(null);
	        }
	    }
	};

	$scope.removeHouseholderMarkers = function () {
	    $scope.showHouseholdersText = "Show Householders";
	    $scope.showHouseholders = false;
	    for (var i = 0; i < shared.markers.length; i++) {
	        if (shared.markers[i].type == "householder") {
	            shared.markers[i].setMap(null);
	        }
	    }
	};

	$scope.setZoomMessage = function (zoom) {
	    $scope.zoomMessage = "You just zoomed to " + zoom + "!";
	};

	$scope.openMarkerInfo = function (marker) {
	    $scope.currentMarker = marker;
	    $scope.currentMarkerLat = marker.getPosition().lat();
	    $scope.currentMarkerLng = marker.getPosition().lng();
	    $scope.myInfoWindow.open($scope.myMap, marker);
	};

	$scope.setMarkerPosition = function (marker, lat, lng) {
	    marker.setPosition(new google.maps.LatLng(lat, lng));
	};

	$scope.setViewportToCover = function (waypoints) {
	    var bounds = new google.maps.LatLngBounds();
	    for (var i = 0; i < waypoints.length; ++i) {
	        bounds.extend(waypoints[i]);
	    }
	    shared.map.fitBounds(bounds);
	}

	$scope.hoveredHouseholder = 0;
	$scope.hoverHouseholder = function (id) {
	    $scope.hoveredHouseholder = id;
	}

	$scope.optimize = function () {
	    $(".progress .bar").hide().width("0%").show();
	    $scope.skipRedraw = true;
	    shared.broadcastMapRendering(true);
	    mode = 1;
	    tsp.setAvoidHighways(false);
	    tsp.setTravelMode(google.maps.DirectionsTravelMode.DRIVING);
	    tsp.setOnProgressCallback(function () {
	        $scope.max = 100;
	        $scope.progress = Math.floor(100 * tsp.getNumDirectionsComputed() / tsp.getNumDirectionsNeeded());
	        $(".progress .bar").width($scope.progress + "%");
	    });
	    tsp.solveAtoZ(function () {
	        var orders = tsp.getOrder();
	        var dirRes = tsp.getGDirections();
	        var dir = dirRes.routes[0];

	        //re-order seqnum for householders
	        var order = tsp.getOrder().slice(1);
	        $.each($scope.householders, function (index, h) {

	            for (var i = 0; i <= order.length; i++) {
	                if (order[i] - 1 == index) {
	                    h.SeqNum = i + 1;
	                    break;
	                }
	            }
	        });

	        shared.broadcastHouseholders($scope.householders);
	        $scope.removeOldMarkers();
	        //create icons with new seqnum
	        for (var i = 0; i < dir.legs.length; i++) {
	            var route = dir.legs[i];
	            var hhId = $scope.householders[i].Id;
	            $scope.drawHouseholderMarker(route.end_location, route.end_address, i + 1, hhId);
	        }

	        setTimeout(function () {
	            if ($scope.progress == 100) $(".progress .bar").hide().width("0%").show();
	        }, 6000);

	        shared.broadcastMapRendering(false);
	        $scope.skipRedraw = false;
	    });
	}

	$scope.markerClicked = function (householder) {
	    $location.path("edithouseholder/" + householder.Id.toString());
	}

	//initialize
	shared.config.headers = $cookieStore.get("headers");
	if (shared.config.headers && shared.config.headers != "") {
	    shared.login();

	}
	else {
	    $scope.user = new User();
	    $scope.congregation = new Congregation();
	    $scope.territories = [];
	    shared.showWelcome = true;
	}

	if ($scope.congregation && $scope.congregation.Address != "") {
	    $scope.startingAddress = $scope.congregation.Address;
	    $scope.defaultZoom = 14;
	    $scope.initMap();
	    //$scope.startingLocation;
	} else {
	    getStartingAddress(function () {
	        $scope.startingAddress = startingAddress;
	        $scope.defaultZoom = startingAddress == "" ? 4 : 14;
	        $scope.initMap();
	    });
	}

	$scope.states = getStates();
	$scope.isTerritoryListCollapsed = true;
	$scope.messages = [];
	$scope.loginMessages = [];

}]);
