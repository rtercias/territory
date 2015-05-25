google.maps.Polygon.prototype.getBounds = function () {
    var bounds = new google.maps.LatLngBounds();
    this.getPath().forEach(function (element, index) { bounds.extend(element) });
    return bounds;
}