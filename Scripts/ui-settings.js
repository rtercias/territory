$(function () {
	//initializeList();
    changeAuthDropdownBehavior();
    $(".main-container").css("height", containerHeight());

    $(window).resize(function () {
        $(".main-container").css("height", containerHeight());
    });

    $(".main-container")
        .on("mouseenter", ".householder-marker", function () {
            var seq = $(this).text();
            var elem = $(".householder-sequence:contains('" + seq + "')").parents(".ui-btn-inner");
            elem.addClass("ui-btn-hover-e");
        })
        .on("mouseleave", ".householder-marker", function () {
            var seq = $(this).text();
            var elem = $(".householder-sequence:contains('" + seq + "')").parents(".ui-btn-inner");
            elem.removeClass("ui-btn-hover-e");
        })
        .on("mouseenter", ".householder-edit", function () {
            var seq = $(this).find(".householder-sequence").text();
            var elem = $(".householder-marker:contains('" + seq + "')");
            elem.addClass("inner-hover");
        })
        .on("mouseleave", ".householder-edit", function () {
            var seq = $(this).find(".householder-sequence").text();
            var elem = $(".householder-marker:contains('" + seq + "')");
            elem.removeClass("inner-hover");
        })
        .on("mouseenter", ".householder-buttons", function () {
            var seq = $(this).siblings(".householder-edit").find(".householder-sequence").text();
            var elem = $(".householder-marker:contains('" + seq + "')");
            elem.addClass("inner-hover");
        })
        .on("mouseleave", ".householder-buttons", function () {
            var seq = $(this).siblings(".householder-edit").find(".householder-sequence").text();
            var elem = $(".householder-marker:contains('" + seq + "')");
            elem.removeClass("inner-hover");
        })
    ;
});

function changeAuthDropdownBehavior() {
    $(".auth-menu .auth-username, .auth-menu .auth-password, .change-start").click(function (e) {
		e.stopPropagation();
	});
}

function initializeList() {
	$(".householders-pane").bind("pageinit", function () {
		$(".householders-list").listview().listview("refresh");
	});
}

function getStartingAddress(callback) {
    var YOUR_KEY = "91785d395ac0a1741b41732c4e2667353a17eca95cd095104c3b604f02ff6da4";
    var IP_URL = "http://api.ipinfodb.com/v3/ip-city/?key=" + YOUR_KEY + "&format=json&callback=?";

    $.ajax({
        type: "POST",
        url: IP_URL,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        method: 'GET',
        timeout: 5000,
        success: function (data) {
            startingAddress = data.cityName + "," + data.regionName + " " + data.countryCode + " " + data.zipCode;
            if (typeof callback == "function") {
                callback();
            }
        },
        error: function () {
            startingAddress = "";
            if (typeof callback == "function") {
                callback();
            }
        }
    });//$.ajax({
}

function containerHeight() {
    return $(window).height() - $("header").height() - $(".progress").height() - $("footer").height();
}