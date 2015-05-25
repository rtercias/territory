"use strict";

angular.module("TerritoryManager.controllers", [])
	.controller("MainCtrl", ["$scope", "$dialog", "$route", "$location", "$routeParams", "$http", "$cookieStore", "shared", "orderByFilter", "authService", function ($scope, $dialog, $route, $location, $routeParams, $http, $cookieStore, shared, orderByFilter, authService) {
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
				$scope.loginText = "Logged in: ";
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
                $scope.getFirstTerritory($scope.congregation.Id);
		        $scope.getTerritories($scope.congregation.Id);
		    }
		});

		$scope.$on("broadcastTerritories", function () {
		    $scope.territories = shared.territories;
		    $scope.drawTerritoryMarkers();
		    $scope.drawSurveyTerritories();
		});

		$scope.$on("broadcastHouseholders", function () {
			$scope.householders = shared.householders;
			shared.showWelcome = false;
			$scope.drawHouseholderMarkers();
		});

		$scope.$on("broadcastCurrentTerritory", function () {
		    $scope.territory = shared.currentTerritory;
		    

			if ($scope.user.LoggedIn && $scope.user.Status != "Pending" && $scope.territory) {
			    $scope.getHouseholders($scope.territory.Id, function () {
			        //deselect all survey territories
			        for (var i = 0; i < shared.shapes.length; i++) {
			            $scope.deselectBorder(shared.shapes[i]);
			        }

			        switch ($scope.territory.TerritoryType) {
			            case "REG":
			                //hide current territory marker
			                for (var i = 0; i < shared.territoryMarkers.length; i++) {
			                    if ($scope.householders[0] && $scope.householders[0].TerritoryId == shared.territoryMarkers[i].id) {
			                        shared.territoryMarkers[i].setMap(null);
			                        break;
			                    }
			                }
			                break;

			            case "SURVEY-WALK":
			                $scope.householders = [];
			                $location.path("/survey/" + $scope.territory.Id);
			                $scope.borderEditMode = 0;
			                $scope.selectBorder($scope.territory.Id, false);
			                break;
			        }
			    });
			    $scope.isTerritoryListCollapsed = true;
			}
		});

		$scope.$on("broadcastCurrentHouseholder", function () {

		});

		$scope.$on("broadcastMessage", function () {
			if (shared.message) {
				if (shared.message.context == "main") {
					$scope.messages = [shared.message];
				}
				else if (shared.message.context == "login") {
					$scope.loginMessages = [shared.message];
				}

				setTimeout(function () {
				    $scope.messages = [];
				    $scope.loginMessages = [];
				}, 5000);
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
		    shared.broadcastMessage();
		    //set up config for api calls. this will be re-used throughout the current session
		    shared.config.headers = { Authorization: "Basic " + Base64.encode($scope.user.UserName + ":" + $scope.user.Password) };
		    shared.login(function () {
		        shared.broadcastShowWelcome(false);
		    });
		}

		$scope.logout = function () {
		    shared.logout(function () {
		        $scope.stopRendering = true;
		        shared.broadcastLoading(false);
		        $scope.householders = [];
		        $scope.territory = new Territory();
		        shared.showWelcome = true;
		        $scope.removeOldMarkers();
		        if (!$scope.$$phase) {
		            $scope.$apply();
		        }
		    });
		}

		$scope.allChecked = false;
		$scope.checkAll = function () {
		    $scope.selectedTerritories = [];
		    for (var i = 0; i < $scope.territories.length; i++) {
		        $scope.territories[i].Selected = $scope.allChecked;
		        if ($scope.territories[i].Selected) {
		            $scope.selectedTerritories.push($scope.territories[i].Id);
		        }
		    }
		};

		$scope.selectedTerritories = [];

		$scope.checkOne = function ($event, terrId) {
		    var checkbox = $event.target;

		    if (checkbox.checked) {
		        $scope.selectedTerritories.push(terrId);
		    }
		    else {
		        for (var i = 0; i < $scope.selectedTerritories; i++) {
		            if ($scope.selectedTerritories[i] == terrId) {
		                $scope.selectedTerritories.splice(i, 1);
		            }
		        }
		    }
		};

		$scope.printMultiple = function () {
		    $scope.selectedTerritories = [];
		    for (var i = 0; i < $scope.territories.length; i++) {
		        if ($scope.territories[i].Selected) {
		            $scope.selectedTerritories.push($scope.territories[i].Id);
		        }
		    }

		};

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
		            .error(function() {
		                $scope.loading = false;
		            });
		    }
		}
		
		$scope.getFirstTerritory = function (congId) {
		    $scope.loading = true;
		    if (congId) {
		        $http({ method: 'GET', url: urlWebAPI + '/territory/first?congId=' + congId, headers: shared.config.headers })
                    .success(function (data) {
                        var terr = shared.populateTerritory(data);
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
		        shared.getTerritories(congId);
		    }
		}

		$scope.getHouseholders = function (terrId, callback) {
		    $scope.loading = true;
		    $scope.householders = [];
		    if (terrId) {
		        $http({ method: 'GET', url: urlWebAPI + '/householder/byterr/' + terrId, headers: shared.config.headers })
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
                                householder.IsDoNotCall = h.IsDoNotCall;
                                householder.IsActive = h.IsActive;
                                $scope.householders.push(householder);
                            });
                        }
                        
                        shared.broadcastHouseholders($scope.householders);
                        if (typeof callback == "function") {
                            callback();
                        }
                    })
		            .error(function() {
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

		$scope.initMap = function () {
		    $scope.messages = [];
		    geocoder = new google.maps.Geocoder();
		    google.maps.visualRefresh = true;
		    geocoder.geocode({ 'address': $scope.startingAddress }, function (results, status) {
		        if (status == google.maps.GeocoderStatus.OK) {
		            $scope.startingLocation = results[0].geometry.location;
		            var myOptions = {
		                zoom: $scope.defaultZoom,
		                minZoom: 7,
		                center: results[0].geometry.location,
		                mapTypeId: google.maps.MapTypeId.ROADMAP,
		                disableDefaultUI: true,
		                zoomControl: true,
		                suppressInfoWindows: true,
		                zoomControlOptions: {
		                    style: google.maps.ZoomControlStyle.SMALL
		                }
		            }

		            shared.map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
		            tsp = new BpTspSolver(shared.map, document.getElementById("directions"));

		            google.maps.event.addListener(tsp.getGDirectionsService(), "error", function () {
		                console.log("Request failed: " + reasons[tsp.getGDirectionsService().getStatus().code]);
		            });

		            google.maps.event.addListener(shared.map, "zoom_changed", function () {
		                if (shared.map.getZoom() <= 12) {
		                    $scope.hideSurveyTerritoriesText();
		                }
		                else {
		                    $scope.showSurveyTerritoriesText();
		                }
		            });
		        }
		    });
		}
		
		$scope.skipRedraw = false;

		$scope.drawHouseholderMarkers = function () {
		    //remove existing markers first
		    $scope.removeHouseholderMarkers();
		    if (tsp) tsp.startOver();

		    //hide current territory icon
		    //$(".territory-marker").show();
		    //if ($scope.householders[0]) $(".territory-marker#" + $scope.householders[0].TerritoryId).hide();
			$scope.showHouseholdersText = "Hide Householders";
			$scope.showHouseholders = true;

			$(".progress .bar").hide().width("0%").show();

			if ($scope.user && $scope.user.LoggedIn && $scope.user.Status != "Pending") {
				//$scope.drawKingdomHallMarker();
				//tsp.addAddress($scope.startingAddress);
			}

			if (!$scope.householders) return false;
			var l = $scope.householders ? $scope.householders.length : 0;		
			var waypoints = [];
			

			for (var i = 0; i < l; i++) {
				var addr =
                    $scope.householders[i].Address + " "
                    + $scope.householders[i].AptNum + " "
                    + $scope.householders[i].City + " "
                    + $scope.householders[i].State + " "
                    + $scope.householders[i].Zip;
				
				var label = $scope.householders[i].SeqNum;
				var hhId = $scope.householders[i].Id;
				var bits = $scope.householders[i].Location.split(/,\s*/);
				var location = new google.maps.LatLng(parseFloat(bits[0]), parseFloat(bits[1]));
				waypoints.push(location);

				if ($scope.householders[i].Location == null || $scope.householders[i].Location == "") {
				    console.log("Address has no location: " + addr);
				}
				else {
				    $scope.drawHouseholderMarker(location, addr, label, hhId);
				    
				    if (!tsp) {
				        tsp = new BpTspSolver(shared.map, document.getElementById("directions"));
				    }

				    tsp.addAddressWithLabel(addr, label, hhId, function (a, latlng, lbl, id) {
				        $scope.setViewportToCover(waypoints);

				        $scope.progress = Math.floor(100 * (waypoints.length / l));
				        $(".progress .bar").width($scope.progress + "%");

				        setTimeout(function () {
				            $scope.progress = 100;
				            $(".progress .bar").width($scope.progress + "%");
				            $scope.loading = false;
				            //shared.broadcastMapRendering(false);
				        }, 1000);
				    });
				    
				}
			}
		};

		$scope.geoCode = function (h) {
		    shared.geocodeHouseholder(h.Id);
		    $scope.getHouseholders(h.TerritoryId);
		};

		$scope.showHouseholderDetail = function (id) {
			$location.path("edithouseholder/" + id);
		};

		$scope.drawHouseholderMarker = function (latlng, addr, label, id) {
		    var sId = id ? id.toString() : "";
		    
		    var marker = new RichMarker({
		        id: id,
				type: "householder",
				position: latlng,
				map: shared.map,
				draggable: false,
				title: addr,
				flat: true,
		        content: '<a href="edithouseholder/' + id + '" title="' + addr + '"><span class="householder-marker badge badge-inverse">' + pad(label, 2) + '</span></a>'
			});

		    google.maps.event.addListener(marker, "click", function () {
			    $location.path("edithouseholder/" + id.toString());
			    shared.map.setCenter(latlng);
			    if (shared.map.getZoom()<16) shared.map.setZoom(16);
			});

			if ($scope.stopRendering) {
			    marker.setMap(null);
			}

			shared.markers.push(marker);
		}

		$scope.removeOldMarkers = function () {
			for (var i = 0; i < shared.markers.length; ++i) {
				shared.markers[i].setMap(null);
			}
            
			shared.markers = [];

			for (var i = 0; i < shared.territoryMarkers.length; i++) {
			    shared.territoryMarkers[i].setMap(null);
			}

			shared.territoryMarkers = [];
		};

		$scope.drawKingdomHallMarker = function () {
		    if ($scope.congregation) {
		        geocoder.geocode({ 'address': $scope.congregation.Address }, function (results, status) {
		            if (status == google.maps.GeocoderStatus.OK) {
		                var loc = results[0].geometry.location;

		                var marker = new RichMarker({
		                    type: "kingdomHall",
		                    position: loc,
		                    map: shared.map,
		                    draggable: false,
		                    flat: true,
		                    content: '<div class="kh-marker label label-warning">Kingdom Hall</div>'
		                });
		                //shared.markers.push(marker);
		            }
		            else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
		                setTimeout(function () {
		                    $scope.drawKingdomHallMarker();
		                }, 100);
		            }
		        });
		    }
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
			    if ($scope.territories[i].TerritoryType != "PHONE" && $scope.territories[i].MiddleLocation != null && $scope.territories[i].MiddleLocation != "") {
			        $scope.drawTerritoryMarker($scope.territories[i].TerritoryName, $scope.territories[i].MiddleLocation, $scope.territories[i].Id, l - 1, i);
			    }
			}
		};

		$scope.drawTerritoryMarker = function (territoryName, location, id, l, i) {
			$scope.progress = Math.floor(100 * i / l);
			$(".progress .bar").width($scope.progress + "%");

			var latlngArray = [];
			var input = latlngArray[i];
			var latlngStr = location.split(",", 2);
			var lat = parseFloat(latlngStr[0]);
			var lng = parseFloat(latlngStr[1]);
			latlngArray[i] = new google.maps.LatLng(lat, lng);

			var marker = new RichMarker({
                id: id,
				type: "territory",
				position: latlngArray[i],
				map: shared.map,
                flat: true,
				content: '<div id="' + id + '" class="territory-marker">' + territoryName + '</div>'
			});
			shared.territoryMarkers.push(marker);

			google.maps.event.addListener(marker, "click", function (event) {
			    $scope.$apply($location.path("/" + id));
			});
		};

		$scope.drawSurveyTerritories = function () {
		    $scope.surveyTerritoriesShown = true;
		    $(".progress .bar").hide().width("0%").show();

		    var l = $scope.territories.length;
		    for (var i = 0; i < l; i++) {
		        if ($scope.territories[i].TerritoryType == "SURVEY-WALK" && $scope.territories[i].Borders != null && $scope.territories[i].Borders != "") {
		            $scope.drawSurveyTerritory(false, $scope.territories[i].Id, $scope.territories[i].Borders, $scope.territories[i].TerritoryName);
		        }
		    }
		};

		$scope.showSurveyTerritories = function () {
		    $scope.surveyTerritoriesShown = true;
		    for (var i = 0; i < shared.shapes.length; i++) {
		        shared.shapes[i].setMap(shared.map);
		        shared.shapes[i].label.set("map", shared.map);  //show label
		    }
		};

		$scope.showSurveyTerritoriesText = function () {
		    for (var i = 0; i < shared.shapes.length; i++) {
		        if (shared.shapes[i].label) {
		            shared.shapes[i].label.set("map", shared.map);  //show label
		            break;
		        }
		    }
		}

		$scope.hideSurveyTerritories = function () {
		    $scope.surveyTerritoriesShown = false;
		    for (var i = 0; i < shared.shapes.length; i++) {
		        shared.shapes[i].setMap(null);
		        shared.shapes[i].label.set("map", null);    //hide label
		    }
		};

		$scope.hideSurveyTerritoriesText = function () {
		    for (var i = 0; i < shared.shapes.length; i++) {
		        shared.shapes[i].label.set("map", null);    //hide label
		    }
		};

		$scope.hideHouseholderMarkers = function () {
		    $scope.showHouseholdersText = "Show Householders";
		    $scope.showHouseholders = false;
		    for (var i = 0; i < shared.markers.length; i++) {
		        if (shared.markers[i].type == "householder") {
		            shared.markers[i].setMap(null);
		        }
		    }

		    if ($scope.showTerritories) {
		        for (var i = 0; i < shared.territoryMarkers.length; i++) {
		            if ($scope.householders[0] && $scope.householders[0].TerritoryId == shared.territoryMarkers[i].id) {
		                shared.territoryMarkers[i].setMap(shared.map);
		            }
		        }
		    }
		};

		$scope.showHouseholderMarkers = function () {
		    $scope.showHouseholdersText = "Hide Householders";
		    $scope.showHouseholders = true;
		    for (var i = 0; i < shared.markers.length; i++) {
		        if (shared.markers[i].type == "householder") {
		            shared.markers[i].setMap(shared.map);
		        }
		    }

		    for (var i = 0; i < shared.territoryMarkers.length; i++) {
		        if ($scope.householders[0] && $scope.householders[0].TerritoryId == shared.territoryMarkers[i].id) {
		            shared.territoryMarkers[i].setMap(null);
                   break;
		        }
		    }
		};

		$scope.hideTerritoryMarkers = function () {
			$scope.showTerritoriesText = "Show Territories";
			$scope.showTerritories = false;
			for (var i = 0; i < shared.territoryMarkers.length; i++) {
			    if (shared.territoryMarkers[i].type == "territory") {
					shared.territoryMarkers[i].setMap(null);
				}
			}
		};

		$scope.showTerritoryMarkers = function () {
		    $scope.showTerritoriesText = "Hide Territories";
		    $scope.showTerritories = true;
		    for (var i = 0; i < shared.territoryMarkers.length; i++) {
		        if ($scope.householders[0] && $scope.householders[0].TerritoryId != shared.territoryMarkers[i].id || !$scope.showHouseholders) {
		            shared.territoryMarkers[i].setMap(shared.map);
		        }
		    }
		};

		$scope.removeHouseholderMarkers = function () {
			$scope.showHouseholdersText = "Show Householders";
			$scope.showHouseholders = false;
			for (var i = 0; i < shared.markers.length; i++) {
			    if (shared.markers[i].type == "householder" || shared.markers[i].type == "householder-new") {
			        shared.markers[i].setMap(null);
				}
			}
			shared.markers = [];
		};

		$scope.removeBorders = function (id) {
		    if (shared.shapes) {
		        for (var i = 0; i < shared.shapes.length; i++) {
		            if (shared.shapes[i].id == id) {
		                shared.shapes[i].setMap(null);
		                $scope.borderEditMode = 0;
		                shared.shapes.splice(i, 1);
		                $scope.territory.Borders = null;
		                break;
		            }
		        }
		    }
		};

		$scope.editBorders = function (id) {
		    $scope.borderEditMode = 2;
		    if (shared.shapes) {
		        for (var i=0; i < shared.shapes.length; i++) {
		            if (shared.shapes[i].id == id) {
		                shared.shapes[i].setOptions({ editable: true, draggable: true });
		                break;
		            }
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
		    if (waypoints) {
		        var bounds = new google.maps.LatLngBounds();
		        for (var i = 0; i < waypoints.length; ++i) {
		            bounds.extend(waypoints[i]);
		        }
		        if (shared.map) shared.map.fitBounds(bounds);
		    }
		}

		$scope.hoveredHouseholder = 0;
		$scope.hoverHouseholder = function (id) {
		    $scope.hoveredHouseholder = id;
		}

		$scope.refreshMap = function () {
		    shared.broadcastCurrentTerritory($scope.territory);
		};

		$scope.isOptimized = false;

		$scope.optimize = function (roundtrip) {
		    shared.broadcastLoading(true);
		    shared.broadcastMessage("Please wait...", "warning", "main");
		    if ($scope.isOptimized) $scope.drawHouseholderMarkers();
		    $scope.isOptimized = false;
		    shared.broadcastLoading(true);
		    $(".progress .bar").hide().width("0%").show();
			mode = 1;
			tsp.setAvoidHighways(false);
			tsp.setTravelMode(google.maps.DirectionsTravelMode.DRIVING);
			tsp.setOnProgressCallback(function () {
				$scope.max = 100;
				$scope.progress = Math.floor(100 * tsp.getNumDirectionsComputed() / tsp.getNumDirectionsNeeded());
				$(".progress .bar").width($scope.progress + "%");
				shared.broadcastLoading(true);
				shared.broadcastMessage("Please wait...", "warning", "main");
			});

		    //add starting location
			if (!$scope.startingLocation == "") $scope.startingLocation = $scope.congregation.Address;
			tsp.addAddress($scope.startingLocation, function () {
			    var waypoints = tsp.getWaypoints();
			    tsp.setAsStart(waypoints[waypoints.length - 1]);
			    if (roundtrip) {
			        tsp.solveRoundTrip(function () {
			            $scope.saveOptimizedAddresses();
			        });
			    }
			    else {
			        tsp.solveAtoZ(function () {
			            $scope.saveOptimizedAddresses();
			        });
			    }
			});
		}

		$scope.saveOptimizedAddresses = function () {
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

		    shared.saveHouseholders($scope.householders);
		    shared.broadcastHouseholders($scope.householders);

		    setTimeout(function () {
		        shared.broadcastMessage("Addresses optimized.", "success", "main");
		        if ($scope.progress == 100) $(".progress .bar").hide().width("0%").show();
		        $scope.isOptimized = true;
		        shared.broadcastLoading(false);
		    }, 6000);

		    shared.broadcastLoading(false);
		    shared.broadcastMessage("Addresses optimized.", "success", "main");
		}

		$scope.markerClicked = function (id) {
		    $location.path("edithouseholder/" + id);
		}

		$scope.selectBorder = function (id) {
		    if (shared.shapes) {
		        for (var i = 0; i < shared.shapes.length; i++) {
		            if (shared.shapes[i].id == id) {
		                shared.shapes[i].setOptions({
		                    editable: false,
		                    draggable: false,
		                    strokeColor: "#ff4242",
                            strokeOpacity: 0.75,
		                    fillColor: "transparent"
		                });
		                google.maps.event.clearListeners(shared.shapes[i], 'mouseover');
		                google.maps.event.clearListeners(shared.shapes[i], 'mouseout');

		                //set path if territory.Borders is populated
		                var path = google.maps.geometry.encoding.decodePath($scope.territory.Borders);
		                $scope.setViewportToCover(path);
		            }
		            else {
		                $scope.deselectBorder(shared.shapes[i]);
		            }
		        }
		    }
		}

		$scope.deselectBorder = function (shape) {
		    var strokeColor = getRandomBlueHue();

		    shape.setOptions({
		        editable: false,
		        draggable: false,
		        strokeColor: strokeColor,
		        fillColor: strokeColor
		    });

		    google.maps.event.addListener(shape, 'mouseover', function (event) {
		        this.setOptions({ strokeOpacity: 0.5 });
		    });

		    google.maps.event.addListener(shape, 'mouseout', function (event) {
		        this.setOptions({ strokeOpacity: 0.15 });
		    });
		}
		
		$scope.drawSurveyTerritory = function (editable, id, borderCoordinates, label) {
		    var strokeColor = editable ? "#ff4242" : getRandomBlueHue();
		    var strokeWeight = 10;

		    var shape = new google.maps.Polygon({
                id: id,
		        strokeColor: strokeColor,
		        strokeOpacity: 0.15,
		        strokeWeight: strokeWeight,
		        fillColor: strokeColor,
		        fillOpacity: 0.15,
		        editable: editable,
                draggable: editable
		    });

		    shape.setMap(shared.map);


            google.maps.event.addListener(shape, 'click', function (event) {
		        $scope.$apply($location.path("/" + id));
		    });		    

		    if (!editable) {
		        $scope.borderEditMode = 0;
		        shape.borderMouseOver = google.maps.event.addListener(shape, 'mouseover', function (event) {
		            this.setOptions({ strokeOpacity: 0.5 });
		        });

		        shape.borderMouseOut = google.maps.event.addListener(shape, 'mouseout', function (event) {
		            this.setOptions({ strokeOpacity: 0.15 });
		        });
		    }
		    else {
		        $scope.borderEditMode = 1;
		        google.maps.event.addListener(shared.map, 'click', function (event) {
		            if (shape.get('editable')) {
		                var path = shape.getPath();
		                path.push(event.latLng);
		                $scope.territory.Borders = google.maps.geometry.encoding.encodePath(path);
		                shared.broadcastCurrentTerritory($scope.territory);
		            }
		        });
		    }

		    //set path if territory.Borders is populated
		    if (borderCoordinates && borderCoordinates != "") {
		        var path = google.maps.geometry.encoding.decodePath(borderCoordinates);
		        if (path) {
		            shape.setPath(path);
		            //$scope.setViewportToCover(path);
		        }


		        //RT - this doesn't seem to be appropriate, as in some cases the user may want to stay in the current map view
		        //if no borders have been drawn, set map center equal to congregation address
		        //if ($scope.territory.Borders == "") {
		        //shared.map.setCenter($scope.startingLocation);
		        //shared.map.setZoom(16);
		        //}

		        //google.maps.event.addListener(shared.borders, 'zoom_changed', function () {
		        //    console.log(shared.map.getZoom());
		        //    var newStrokeWeight = strokeWeight - ((shared.map.getZoom()/21)/strokeWeight);
		        //    this.setOptions({ strokeWeight: newStrokeWeight });
		        //});

		        shape.label = new MapLabel({
		            text: label,
		            position: shape.getBounds().getCenter(),
		            map: shared.map,
		            fontSize: 14,
		            align: 'center'
		        });
		    }
		    shared.shapes.push(shape);
		}

	    //initialize
		shared.config.headers = $cookieStore.get("headers");
		$scope.congregation = new Congregation();
		if (shared.config.headers && shared.config.headers != "") { 
		    shared.login(function() {
		        if ($scope.congregation && $scope.congregation.Address != "") {
		            $scope.startingAddress = $scope.congregation.Address;
		            $scope.defaultZoom = 14;
		            $scope.initMap();
		            //enquire
                    //    .register("screen and (max-width: 767px)", {
                    //        unmatch: function () {
                    //            $scope.initMap();
                    //        }
                    //    })
                    //    .register("screen and (min-width: 767px)", {
		            //    match: function () {
		            //        $scope.initMap();
		            //    }
		            //})
		        }
		    });
		}
		else {
		    $scope.user = new User();
		    $scope.territories = [];
		    shared.templates = [{ name: "welcome", url: "templates/welcome.html" }];
		    shared.showWelcome = true;
		    getStartingAddress(function () {
		        $scope.startingAddress = startingAddress;
		        $scope.defaultZoom = startingAddress == "" ? 4 : 14;
		        $scope.initMap();
		    });
		    $scope.initMap();
		}

		$scope.countries = [];
		$scope.getCountries = function () {
		    $scope.countries.push("United States");
		}

		$scope.states = getStates();
		$scope.getCountries();
		$scope.isTerritoryListCollapsed = true;
		$scope.messages = [];
		$scope.loginMessages = [];
		$scope.borderEditMode = 0;
		
	}])
	.controller("HouseholderListCtrl", ["$scope", "$routeParams", "$location", "$http", "$dialog", "$cookieStore", "shared", "orderByFilter", function ($scope, $routeParams, $location, $http, $dialog, $cookieStore, shared, orderByFilter) {
		$scope.template = shared.templates[0];
		$scope.territory;

		$scope.$on('$viewContentLoaded', function () {
		    $scope.territory = new Territory();
			$scope.showWelcome = shared.showWelcome;

			if ($routeParams.territoryId) {
				var terrId = $routeParams.territoryId;
				var l = shared.territories.length;
				for (var i = 0; i < l; i++) {
					if (shared.territories[i].Id == terrId) {
					    $scope.territory = shared.territories[i];
					    $cookieStore.put('territoryId', $scope.territory.Id);
					    $scope.isTerritoryListCollapsed = true;
						shared.broadcastCurrentTerritory($scope.territory);
						break;
					}
				}
			}
		});

		$scope.$on("broadcastHouseholders", function () {
			if (!$scope.$$phase) {
				$scope.$apply($scope.householders = shared.householders);
			}
			setTimeout(function () {
			    $scope.showWelcome = !$scope.householders || $scope.householders.length == 0;
			    $(".householders-list ul").listview("refresh");
			}, 100);
		});

		//$scope.$on("broadcastMapRendering", function () {
		//	if (!$scope.$$phase) {
		//		$scope.$apply($scope.mapIsRendering = shared.mapIsRendering);
		//	}
		//});

		$scope.$on("broadcastCurrentTerritory", function () {
			if (!$scope.$$phase) {
			    $scope.$apply($scope.territory = shared.currentTerritory);
			}
		});

		$scope.$on("broadcastShowWelcome", function () {        
		    $scope.template = shared.templates[0];
		    $scope.showWelcome = shared.showWelcome;
		});

		$scope.selectHouseholder = function (h) {
		    $scope.householder = h;
		}

		//$scope.mapIsRendering = false;

		$scope.messages = [];

		$scope.moveUp = function (h) {
			if (h.SeqNum == 1) {
				h.MessageType = "alert alert-warning";
				h.Message = "Address is already at the top";

				setTimeout(function () {
					$scope.$apply(function () {
						h.Message = "";
						h.MessageType = "";
					});
				}, 5000);

				return;
			}

			if (h.IsLocked) {
				h.MessageType = "alert alert-warning";
				h.Message = "This address is locked";

				setTimeout(function () {
					$scope.$apply(function () {
						h.Message = "";
						h.MessageType = "";
					});
				}, 5000);

				return;
			}

			var origPos = parseInt(h.SeqNum);
			var affectedHouseholders = [];
			for (var i = origPos; i >= 1; i--) {
				if ($scope.householders[i - 2] && !$scope.householders[i - 2].IsLocked) {
					var newPos = parseInt(i - 1);
					h.SeqNum = newPos;
					affectedHouseholders.push(h);

					$scope.householders[i - 2].SeqNum = origPos;					
					affectedHouseholders.push($scope.householders[i - 2]);

					var skipped = origPos - newPos - 1;
					if (skipped > 1) {
						h.MessageType = "alert alert-warning";
						h.Message = skipped + " locked addresses were skipped";
						setTimeout(function () {
							$scope.$apply(function () {
								h.Message = "";
								h.MessageType = "";
							});
						}, 5000);
					}
					break;
				}
			}
			
			shared.saveHouseholders(affectedHouseholders);
			shared.broadcastHouseholders($scope.householders);
		};

		$scope.moveDown = function (h) {
			if (origPos == $scope.householders.length) {
				h.MessageType = "alert alert-warning";
				h.Message = "Address is already at the bottom";

				setTimeout(function () {
					$scope.$apply(function () {
						h.Message = "";
						h.MessageType = "";
					});
				}, 5000);

				return;
			}

			if (h.IsLocked) {
				h.MessageType = "alert alert-warning";
				h.Message = "This address is locked";

				setTimeout(function () {
					$scope.$apply(function () {
						h.Message = "";
						h.MessageType = "";
					});
				}, 5000);

				return;
			}

			var origPos = parseInt(h.SeqNum);
			var affectedHouseholders = [];
			for (var i = origPos; i <= $scope.householders.length; i++) {
				if (!$scope.householders[i].IsLocked) {
					var newPos = parseInt(i + 1);
					h.SeqNum = newPos;
					affectedHouseholders.push(h);

					$scope.householders[i].SeqNum = origPos;
					affectedHouseholders.push($scope.householders[i]);

					var skipped = newPos - origPos - 1;
					if (skipped > 1) {
						h.MessageType = "alert alert-warning";
						h.Message = skipped + " locked addresses were skipped";
						setTimeout(function () {
							$scope.$apply(function () {
								h.Message = "";
								h.MessageType = "";
							});
						}, 5000);
					}
					break;
				}
			}
			
			shared.saveHouseholders(affectedHouseholders);
			shared.broadcastHouseholders($scope.householders);
		};

		$scope.setLock = function (h) {
			h.IsLocked = !h.IsLocked;
			h.Message = "";
			h.MessageType = "";
			if (h.IsLocked) {
			    shared.lockHouseholder(h.Id);
			}
			else {
			    shared.unlockHouseholder(h.Id);
			}
		};

		$scope.setCallStatus = function (h) {
		    h.IsDoNotCall = !h.IsDoNotCall;
		    h.Message = "";
		    h.MessageType = "";
		    if (h.IsDoNotCall) {
		        shared.doNotCallHouseholder(h.Id);
		    }
		    else {
		        shared.activateHouseholder(h.Id);
		    }
		    shared.broadcastCurrentHouseholder(h);
		};

		$scope.removeHouseholder = function (h) {
		    var title = "Address:  " + h.Address + " " + h.AptNum + " " + h.City + ", " + h.State + " " + h.Zip;
		    var mainText = "Are you sure you want to delete this address?";
		    var btns = [{ result: 'ok', label: 'OK', cssClass: 'btn-primary' }, { result: 'cancel', label: 'Cancel' }];
		    $dialog.messageBox(title, mainText, btns)
		        .open()
                .then(function (result) {
                    if (result == 'ok') {
                        shared.deactivateHouseholder(h.Id);
                        //refresh current householder list
                        $scope.householders = shared.householders;
                        shared.broadcastHouseholders($scope.householders);
                        $location.path("/");
                    }
                });
		};


		$scope.pad = function (num) {
			return pad(parseInt(num), 2);
		};
		$scope.lockedTooltip = function (locked) {
			return locked ? "position locked" : "position unlocked";
		};
		$scope.doNotCallTooltip = function (doNotCall) {
		    return doNotCall ? "status: do not call" : "status: ok to call";
		};
	}])
	.controller("TerritoryDetailCtrl", ["$scope", "$routeParams", "$location", "shared", function ($scope, $routeParams, $location, shared) {
	    $scope.territory = new Territory();
	    $scope.isNew = true;

		if ($routeParams.territoryId) {
		    $scope.master = shared.currentTerritory;
		    $scope.territory = angular.copy($scope.master);
            if ($scope.territory.Id != 0) $scope.isNew = false;
		}

		$scope.$watchCollection('[territory.TerritoryName, territory.TerritoryType, territory.Borders, territory.Notes]', function () {
		    shared.broadcastCurrentTerritory($scope.territory);
		});

		$scope.$on("broadcastTerritories", function () {
		    $scope.territories = shared.territories;
		});

		$scope.$on("broadcastCurrentTerritory", function () {
		    $scope.master = shared.currentTerritory;
		    $scope.territory = angular.copy($scope.master);
		});

		$scope.$on("broadcastCurrentCongregation", function () {
		    $scope.congregation = shared.currentCongregation;
		});

		$scope.saveTerritory = function () {
		    shared.broadcastLoading(true);
		    if ($scope.territory) {
                //for survey territory, update border path to make sure the latest changes are captured
		        if ($scope.territory.TerritoryType == "SURVEY-WALK") {
		            if (shared.shapes) {
		                for (var i = 0; i < shared.shapes.length; i++) {
		                    if (shared.shapes[i].id == $scope.territory.Id) {
		                        var path = shared.shapes[i].getPath();
		                        $scope.territory.Borders = google.maps.geometry.encoding.encodePath(path);
		                        break;
		                    }
		                }
		            }
		            else {
		                $scope.territory.Borders = "";
		            }
		        }

		        if ($scope.isNew) {
		            $scope.territory.CongId = $scope.congregation.Id;
		            shared.saveNewTerritory($scope.territory);
		            shared.broadcastLoading(false);
		        }
		        else {    
		            shared.saveExistingTerritory($scope.territory);
		        }
		        //refresh territory list
		        $location.path("/");
		    }
		}

		$scope.cancel = function () {
		    $scope.territory = $scope.master;
		    shared.getTerritory($scope.territory.Id);
		    $location.path("/");
		}

		$scope.territoryTypes = ["REG", "SURVEY-WALK", "SURVEY-PHONE", "PHONE", "LETTER"];
	}])
	.controller("HouseholderDetailCtrl", ["$scope", "$routeParams", "$http", "$location", "$dialog", "shared", function ($scope, $routeParams, $http, $location, $dialog, shared) {
	    $scope.isNew = false;
	    $scope.householders = shared.householders;

	    $scope.$on('$viewContentLoaded', function () {
	        var hId = 0;
	        if ($routeParams.householderId) {
	            hId = $routeParams.householderId;
	            $scope.isNew = false;
	        }
	        else {
	            $scope.isNew = true;
	        }

	        $scope.territory = shared.currentTerritory;
	        $scope.householder = new Householder();
	        $scope.householder.TerritoryId = $scope.territory.Id;
	        $scope.getHouseholder(hId);
	        $scope.suggestTerritories();
	        $scope.suggestedTerritoriesShown = $scope.householder.Id == 0 ? true : false;
	        $scope.getAllTerritories();
	        $scope.isActiveUser = $scope.user.Status == "Active";
	    });

	    $scope.$on("broadcastCurrentHouseholder", function () {
	        if (shared.currentTerritory.Id != $scope.householder.TerritoryId) {
	            shared.getTerritory($scope.householder.TerritoryId);
	        }
	    });

	    $scope.removeHouseholder = function () {
	        var h = $scope.householder;
	        var title = "Address:  " + h.Address + " " + h.AptNum + " " + h.City + ", " + h.State + " " + h.Zip;
	        var mainText = "Are you sure you want to delete this address?";
	        var btns = [{ result: 'ok', label: 'OK', cssClass: 'btn-primary' }, { result: 'cancel', label: 'Cancel' }];
	        $dialog.messageBox(title, mainText, btns)
		        .open()
                .then(function (result) {
                    if (result == 'ok') {
                        shared.deactivateHouseholder($scope.householder.Id);
                        //refresh current householder list
                        $scope.householders = shared.householders;
                        shared.broadcastHouseholders($scope.householders);
                        $location.path("/");
                    }
                });
	    };

	    $scope.setCallStatus = function () {
	        $scope.householder.IsDoNotCall = !$scope.householder.IsDoNotCall;
	        $scope.householder.Message = "";
	        $scope.householder.MessageType = "";
	        if ($scope.householder.IsDoNotCall) {
	            shared.doNotCallHouseholder($scope.householder.Id);
	        }
	        else {
	            shared.activateHouseholder($scope.householder.Id);
	        }
	        shared.broadcastCurrentHouseholder($scope.householder);
	    };

	    $scope.doNotCallTooltip = function () {
	        if ($scope.householder && $scope.householder.IsDoNotCall) {
	            return "allow to call";
	        }
	        else {
	            return "do not call";
	        }
	    }

		$scope.getHouseholder = function (id) {
		    if (id && id > 0) {
		        for (var i = 0; i < shared.householders.length; i++) {
		            if (shared.householders[i].Id == id) {
		                $scope.householder = shared.householders[i];
		                shared.broadcastCurrentHouseholder($scope.householder);
		            }
		        }
		    }
		}

		$scope.newLocation = "";

		$scope.geocodeAddress = function (address, callback) {
		    $scope.newLocation = "";
		    if (!address || address == "") return false;

		    if ($scope.isNew) {
		        var geocoder = new google.maps.Geocoder();
		        geocoder.geocode({ 'address': address }, function (results, status) {
		            if (status == google.maps.GeocoderStatus.OK) {
		                //remove other 'new' marker
		                for (var i = 0; i < shared.markers.length; i++) {
		                    if (shared.markers[i].type == "householder-new") {
		                        shared.markers[i].setMap(null);
		                        shared.markers.splice(i, 1);
		                    }
		                }

		                var location = results[0].geometry.location;

		                $scope.$apply(function () {
		                    //auto-fill country and zip code, if missing
		                    for (var i = 0; i < results[0].address_components.length; i++) {
		                        switch (results[0].address_components[i].types[0]) {
		                            case "country":
		                                if ($scope.householder.Country == "") $scope.householder.Country = results[0].address_components[i].long_name;
		                                break;
		                            case "postal_code":
		                                if ($scope.householder.Zip == "") $scope.householder.Zip = results[0].address_components[i].long_name;
		                                break;
		                        }
		                    }

		                    //capitalize address
		                    $scope.householder.Address = toTitleCase($scope.householder.Address);
		                    $scope.householder.City = toTitleCase($scope.householder.City);
		                });

		                var marker = new RichMarker({
		                    id: 0,
		                    type: "householder-new",
		                    position: location,
		                    map: shared.map,
		                    draggable: false,
		                    title: address,
		                    flat: true,
		                    content: '<span class="new-householder-marker badge badge-inverse" title="' + address + '">NEW</span>'
		                });
		                shared.map.setCenter(location);
		                shared.map.setZoom(18);
		                shared.markers.push(marker);
		                $scope.newLocation = location.toString().replace(/[\s"'()]/g, "");
		                if (typeof callback == "function") {
		                    callback();
		                }
		            }
		            else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
		                setTimeout(function () {
		                    $scope.geocode(address, callback);
		                }, 100);
		            }
		        });
		    }
		}

		$scope.saveHouseholder = function () {
		    if ($scope.householder) {
		        if ($scope.isNew) {
		            $scope.householder.IsActive = true;
		            $scope.householders.push($scope.householder);
		            shared.saveNewHouseholder($scope.householder);
		        }
		        else {
		            shared.saveExistingHouseholder($scope.householder);
		        }
		        //refresh householder list
		        $location.path("/");
		    }
		}

		$scope.suggestTerritories = function () {
		    //if required address fields are not yet filled in, abort
		    if ($scope.householder.Address == "" || $scope.householder.City == "" || $scope.householder.State == "") {
		        return false;
		    }

		    var address =
                    $scope.householder.Address + " "
                    + $scope.householder.City + " "
                    + $scope.householder.State + " "
                    + $scope.householder.Zip;

		    shared.broadcastLoading(true);
		    var suggestedTerritories = [];
		    var congId = $scope.user.Congregations ? $scope.user.Congregations[0].Id : 0;

		    $scope.geocodeAddress(address, function () {
		        $http({ method: 'GET', url: urlWebAPI + '/territory/suggestedterritories?location=' + $scope.newLocation + "&congid=" + congId, headers: shared.config.headers })
                    .success(function (data) {
                        if (data) {
                            $.each(data, function (index, t) {
                                var terr = new Territory();
                                terr.Id = t.Id;
                                terr.TerritoryName = t.TerritoryName;
                                terr.MiddleLocation = t.MiddleLocation;
                                terr.TerritoryType = t.TerritoryType;
                                terr.HouseholderCount = t.HouseholderCount;
                                suggestedTerritories.push(terr);
                            });
                        }
                        shared.broadcastLoading(false);
                        $scope.territoryOptions = suggestedTerritories;
                        $scope.suggestedTerritoriesShown = true;
                    })
                    .error(function () {
                        shared.broadcastLoading(false);
                    });
		    });
		}

		$scope.getAllTerritories = function () {
			$scope.territoryOptions = shared.territories;
			$scope.suggestedTerritoriesShown = false;
		}

		$scope.$watchCollection('[householder.Address,householder.City,householder.State,householder.Zip,householder.Country]', function () {
		    $scope.suggestTerritories();
		});

		$scope.cancel = function () {
		    //remove other 'new' marker
		    for (var i = 0; i < shared.markers.length; i++) {
		        if (shared.markers[i].type == "householder-new") {
		            shared.markers[i].setMap(null);
		            shared.markers.splice(i, 1);
		        }
		    }
		}

	}])
	.controller("MapCtrl", ["$scope", "$location", "$http", "$cookieStore", "shared", "orderByFilter", function ($scope, $location, $http, $cookieStore, shared, orderByFilter) {
		$scope.getReport = function () {
		    try {
		        //attempt login first
		        if ($cookieStore.get("headers")) {
		            shared.login(function(user) {
		                //check if role is sufficient
		                if (user.Roles) {
		                    if (user.Roles.indexOf('Admin') >= 0 || user.Roles.indexOf('PowerUser') >= 0) {
		                        //get data
		                        var terrId = ($location.search()).terrId;
		                        var arrTerrId = terrId.split(",");
		                        $scope.congregation = user.Congregations ? user.Congregations[0] : new Congregation();
		                        $scope.getTerritories(arrTerrId);
		                    }
		                    else {
		                        console.log("User has insufficient permission to view the report.");
		                    }
		                    
		                }
		                else {
		                    console.log("User has insufficient permission to view the report.");
		                    return false;
		                }
		            });
		        }
		    }
		    catch (err) {
		        console.log(err);		        
		    }
		}

		$scope.getTerritories = function (arrTerrId) {
		    if (arrTerrId) {
		        var territories = [];
		        for (var i = 0; i < arrTerrId.length; i++) {
		            var terr = new Territory();
		            if (arrTerrId[i]) {
		                $http({ method: 'GET', url: urlWebAPI + '/territory?id=' + arrTerrId[i], headers: $cookieStore.get("headers") })
                            .success(function (terr) {
                                switch (terr.TerritoryType) {
                                    case "SURVEY-WALK":        
                                        var path = google.maps.geometry.encoding.decodePath(terr.Borders);
                                        if (path) {
                                            //close the polygon (google map polygons are encoded un-closed)
                                            path.push(path[0]);
                                        }

                                        //get bounds for territory border
                                        var bounds = new google.maps.LatLngBounds();
                                        for (var i = 0; i < path.length; i++) {
                                            bounds.extend(path[i]);
                                        }

                                        var ne = bounds.getNorthEast();
                                        var sw = bounds.getSouthWest();

                                        if (path) {
                                            $http({
                                                method: 'GET', url: urlWebAPI + '/householder/bybounds?congid=' + terr.CongId
                                                    + '&latne=' + ne.lat() + '&lngne=' + ne.lng()
                                                    + '&latsw=' + sw.lat() + '&lngsw=' + sw.lng(), headers: $cookieStore.get("headers")
                                            })
                                                .success(function (data) {
                                                    var householders = [];
                                                    $.each(data, function (index, h) {
                                                        var householder = populateHouseholder(h);
                                                        householders.push(householder);
                                                    });

                                                    householders = orderByFilter(householders, "SeqNum");

                                                    terr.householders = householders;
                                                    $scope.hhLimit = 66;
                                                    $scope.colLimit = $scope.hhLimit / 2;
                                                    terr.columnOneHouseholders = terr.householders.slice(0, $scope.colLimit);
                                                    terr.columnTwoHouseholders = terr.householders.slice($scope.colLimit);
                                                    terr.mapUrl = setMapUrlSurvey(google.maps.geometry.encoding.encodePath(path), householders.length);
                                                    territories.push(terr);
                                                    $scope.territories = orderByFilter(territories, "TerritoryName");
                                                });
                                        }
                                        break;

                                    default:
                                        $http({ method: 'GET', url: urlWebAPI + '/householder/byterr/' + terr.Id, headers: $cookieStore.get("headers") })
                                            .success(function (data) {
                                                if (data[0]) {                                            
                                                    var terr = data[0].Territory;
                                                    var householders = [];
                                                    $.each(data, function (index, h) {
                                                        var householder = populateHouseholder(h);
                                                        householders.push(householder);
                                                    });

                                                    householders = orderByFilter(householders, ["IsDoNotCall","SeqNum"]);

                                                    terr.householders = householders;
                                                    $scope.colLength = 15;
                                                    terr.columnOneHouseholders = terr.householders.slice(0, $scope.colLength);
                                                    terr.columnTwoHouseholders = terr.householders.slice($scope.colLength);
                                                    terr.mapUrl = setMapUrl(householders);
                                                    territories.push(terr);
                                                    $scope.territories = orderByFilter(territories, "TerritoryName");
                                                }
                                            });
                                        break;
                                }
                            });

                    }
		        }
		    }
		}
		

		$scope.mapUrl = "";
		//$scope.setColumnedHouseholders = function () {
		//    $scope.columnOneHouseholders = $scope.householders.slice(0, 15);
		//    $scope.columnTwoHouseholders = $scope.householders.slice(15);
		//}

		$scope.addressLengthIsGood = function (h) {
			return (h.Address.length + h.AptNum.length) <= 25;
		}

		$scope.toChar = function (num) {
			return numberToChar(num);
		}

		$scope.householders = [];
		$scope.columnOneHouseholders = [];
		$scope.columnTwoHouseholders = [];
		$scope.territories = [];
		$scope.congregation;
		$scope.getReport();
        
		var d = new Date();
		var month = d.getMonth() + 1;
		var day = d.getDate();
		var year = d.getFullYear();
		$scope.dateStamp = month + "/" + day + "/" + year;

		function setMapUrl(hh) {
			var addresses = "";
			var size = "450x450"; //hh.length > 15 ? "400x400" : "550x500";
			var str = "http://maps.googleapis.com/maps/api/staticmap?size=" + size + "&scale=1&maptype=roadmap&sensor=true";
			for (var i = 0; i < hh.length ; i++) {
			    if (!hh[i].IsDoNotCall) {
			        var marker = "&markers=color:blue%7Clabel:" + numberToChar(hh[i].SeqNum);
			        var address = i > 0 ? "|" : "";
			        address += hh[i].Address + "+" + "," + hh[i].City + "," + hh[i].State + "+" + hh[i].Zip;
			        addresses += address;
			    }
				str += marker + "%7C" + address;
			}

			return str;
		}
		
		function setMapUrlSurvey(paths, hhCount) {
		    var styles = "weight:20%7Ccolor:0x00bbff";
		    var size = "450x450"; //hhCount > $scope.colLimit ? "400x400" : "550x500";
		    var p = "path=" + styles + "%7Cenc:" + paths;
		    var str = "http://maps.googleapis.com/maps/api/staticmap?size=" + size + "&scale=1&maptype=roadmap&sensor=true&" + p;
		    return str;
		}

		function populateHouseholder(h) {
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
	}])
	.controller("ReportsCtrl", ["$scope", "$location", "$http", "$routeParams", "shared", function ($scope, $location, $http, $routeParams, shared) {
	    $scope.congId;
	    $scope.summary = [];
	    $scope.doNotCalls = [];
	    $scope.searchedHouseholders = [];

	    $scope.getSummary = function (congId) {
	        $scope.summary = [];
		    $http({ method: 'GET', url: urlWebAPI + '/report/summary/' + congId, headers: shared.config.headers })
                .success(function (data) {
                    if (data) {
                        $.each(data, function (index, item) {
                            var summaryItem = new SummaryItem();
                            summaryItem.Key = item.Key;
                            summaryItem.Value = item.Value;
                            $scope.summary.push(summaryItem);
                        });
                    }
                })
		        .error(function(data) {
		        });
		};

	    $scope.getDoNotCalls = function (congId) {
	        $scope.doNotCalls = [];
		    $http({ method: 'GET', url: urlWebAPI + '/report/donotcalls/' + congId, headers: shared.config.headers })
                .success(function (data) {
                    if (data) {
                        $.each(data, function (index, h) {
                            var householder = new Householder();
                            householder.Id = h.Id;
                            householder.TerritoryId = h.TerritoryId;
                            householder.TerritoryName = h.Territory.TerritoryName;
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
                            householder.IsDoNotCall = h.IsDoNotCall;
                            householder.IsActive = h.IsActive;
                            $scope.doNotCalls.push(householder);
                        });
                    }
                })
		        .error(function (data) {
		        });
	    };

	    $scope.searchText = "";
	    $scope.search = function (text, congId) {
	        $scope.searchedHouseholders = [];
	        $http({ method: 'GET', url: urlWebAPI + '/householder/search?text=' + encodeURIComponent(text) + '&congid=' + congId, headers: shared.config.headers })
                .success(function (data) {
                    if (data) {
                        $.each(data, function (index, h) {
                            var householder = shared.populateHouseholder(h);
                            $scope.searchedHouseholders.push(householder);
                        });
                    }
                })
		        .error(function (data) {
		        });
	    };

		$scope.congId = shared.currentCongregation.Id;
		if ($location.path().indexOf('summary') > 0) {
		    $scope.getSummary($scope.congId);
		}
		else if ($location.path().indexOf('dnc') > 0) {
		    $scope.getDoNotCalls($scope.congId);
		}    
		else if ($location.path().indexOf('search') > 0) {
		    if ($routeParams.text) {
		        $scope.search($routeParams.text, $scope.congId);
		    }
		}
	}])
	.controller("AccountsCtrl", ["$scope", "$location", "$http", "$dialog", "shared", function ($scope, $location, $http, $dialog, shared) {
	    $scope.master = shared.currentUser;
	    $scope.user = angular.copy($scope.master);
	    $scope.congregations = [];
	    $scope.opts = {
	        backdrop: true,
	        keyboard: true,
	        backdropClick: true,
	        templateUrl: 'templates/confirm-dialog.html',
	        controller: 'AccountsCtrl',
	        confirmLabel: 'OK',
	        cancelLabel: 'Cancel'
	    };

		$scope.messages = [];

		$scope.isPowerUser = function (user) {
		    if (user.Roles) {
		        if (user.Roles.indexOf('PowerUser') >= 0) return true;
		        else return false;
		    }
		}

		$scope.isAdmin = function (user) {
		    if (user.Roles) {
		        if (user.Roles.indexOf('Admin') >= 0) return true;
		        else return false;
		    }
		}

		$scope.isUser = function (user) {
		    if (user.Roles) {
		        if (user.Roles.indexOf('User') >= 0) return true;
		        else return false;
		    }
		}


		$scope.getUsers = function (congId) {
		    $scope.users = [];
		    shared.broadcastLoading(true);
		    if (congId) {
		        $http({ method: 'GET', url: urlWebAPI + '/user/getbycongid?id=' + congId, headers: shared.config.headers })
                    .success(function (data) {
                        if (data) {
                            $.each(data, function (index, u) {
                                var user = new User();
                                user.Id = u.Id;
                                user.UserName = u.UserName;
                                user.Status = u.Status;

                                if (u.Roles) {
                                    for (var i = 0; i < u.Roles.length; i++) {
                                        user.Roles.push(u.Roles[i].RoleName);
                                    }
                                }
                                $scope.users.push(user);
                            });
                        }
                        shared.broadcastLoading(false);
                        setTimeout(function () {
                            $(".users ul").listview("refresh");
                        }, 1);
                    })
                    .error(function () {
                        shared.broadcastLoading(false);
                    });
		    }
		}

		$scope.showRegistrationText = false;

		$scope.register = function () {
		    $scope.user.Status = "Pending";
		    if (!$scope.congId || $scope.congId == 0) {
		        shared.broadcastMessage("Please select the congregation in which you belong.", "warning", "account");
		        return false;
		    }

		    for (var i = 0; i < $scope.congregations.length; i++) {
		        if ($scope.congregations[i].Id == $scope.congId) {
		            $scope.user.Congregations.push($scope.congregations[i]);
		            break;
		        }
		    }

		    $http({ method: 'POST', url: urlWebAPI + '/user/register', data: $scope.user })
                .success(function(data){
                    $scope.showRegistrationText = true;
                    shared.config.headers = { Authorization: "Basic " + Base64.encode($scope.user.UserName + ":" + $scope.user.Password) };
                    shared.login();
                });
		}

		$scope.isUnchanged = function (user) {
			return angular.equals(user, $scope.master);
		};

		$scope.save = function () {
			//todo: saveUser()
			shared.broadcastCurrentUser($scope.user);
			$location.path("/settings");
		}

		$scope.getAllCongregations = function () {
		    if ($scope.user.LoggedIn && $scope.user.Status == "Active") {
		        $http({ method: 'GET', url: urlWebAPI + '/cong/getall/', headers: shared.config.headers })
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
                    });
		    }
		}

		$scope.resetPassword = function (user) {
		    $scope.opts.title = "Reset Password";
		    $scope.opts.mainText = "Are you sure you want to reset this user's password?";
		    $scope.opts.subText = "User: " + $scope.user.UserName;
		    var d = $dialog.dialog($scope.opts);
		    d.open().then(function (confirmed) {
		        if (confirmed) {
		            //call reset password API

		        }
		    });
		    
		};

        //initialize
		$scope.getAllCongregations();
		$scope.congregation = shared.currentCongregation;
		$scope.getUsers($scope.congregation.Id);
	}])
	.controller("CongregationCtrl", ["$scope", "$location", "shared", function ($scope, $location, shared) {
		$scope.master = shared.currentCongregation;
		$scope.congregation = angular.copy($scope.master);

		$scope.save = function () {
			//todo: saveCongregation();
			shared.broadcastCurrentCongregation($scope.congregation);
			$location.path("/settings");
		}

		$scope.isUnchanged = function (cong) {
			return angular.equals(cong, $scope.master);
		};
	}])

    .controller("DialogCtrl", ["$scope", "opts", function ($scope, opts) {
        $scope.opts = opts;
    }])
;


function getStates() {
	var states = new Array();
	states.push("NY");
	states.push("MA");
	return states;
}

function numberToChar(int) {
	return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789'.charAt(int - 1);
}

function pad(num, size) {
	var s = num + "";
	while (s.length < size) s = "0" + s;
	return s;
}

function toTitleCase(str){
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function rand(min, max) {
    return parseInt(Math.random() * (max - min + 1), 10) + min;
}

function getRandomBlueHue() {
    var h = rand(180, 250);
    var s = rand(30, 100);
    var l = rand(20, 70);
    return 'hsl(' + h + ',' + s + '%,' + l + '%)';
}
