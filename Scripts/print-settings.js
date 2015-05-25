google.maps.event.addDomListener(window, 'load', initialize);
var geocoder, map;

function initialize() {
	codeAddress('100 Main St Albany, NY');
}

function codeAddress(address) {
	geocoder = new google.maps.Geocoder();
	geocoder.geocode({ 'address': address }, function (results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			var myOptions = {
				zoom: 14,
				center: results[0].geometry.location,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			}
			map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);

			var marker = new google.maps.Marker({
				map: map,
				position: results[0].geometry.location
			});
		}
	});
}