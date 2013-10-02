/**
 * TraCINg-Server - Gathering and visualizing cyber incidents on the world
 *
 * Copyright 2013 Matthias Gazzari, Annemarie Mattmann, André Wolski
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var socket = io.connect("/");	// connect to the current server/port

/*
 * startup configuration
 * default view if no link is given: live 2D map (includes: "Live View" button toggled (state "active" in index.html), "2D View" tab in navbar toggled, no side/database window, table and statistics hidden)
 */
 
 // do on startup
$(function () {
	// activate tooltips
	$("[rel=tooltip]").tooltip();
	// no advanced marker info on default
	advInfo = false;
	// prevent having lots of blue space above and below the map if the window is narrow
	$("#map").css("height", function() {return Math.min($("#map").width()/2+50, $(window).height()*0.8);});
	// hide left window
	$(leftWin).hide();
	// center the map
	toggleCenterDivs();
	// if a special url is given show the corresponding div
	goToLocationHash();
	
	$(window).on("hashchange", goToLocationHash);
	
	disableRequestControl();
	
	// based on http://stackoverflow.com/questions/5082235/automatically-set-jquery-ui-datepicker-on-load
	// set datepicker to current date on pageload
	$("#inputDateDay").datepicker("setDate", "null");
	$("#inputDateNoDay").datepicker("setDate", "null");
	
	// zoom tooltips for jVectorMap
	$("div.jvectormap-zoomin").each(function() {
		$(this).rel += "tooltip";
		$(this).attr("title", "Zoom in");
	});
	$("div.jvectormap-zoomout").each(function() {
		$(this).rel += "tooltip";
		$(this).attr("title", "Zoom out");
	});
});

// resolve hash (link)
function goToLocationHash(){
	if(!window.location.hash){
		window.location.hash = "/map";
		return;
	}

	// hide all containers
	$("#mainContent > div").hide();
	$("#errorOutput").show();

	// remove active from all menu entries
	$("#menutabs > li").removeClass('active');
	
	// determine which tab should be shown, default is "map"
	var tab = window.location.hash && window.location.hash.split("/")[1] || "map";
	//console.log("tab: " + tab);

	// show container
	var container = $("#"+tab);
	//console.log("container_pre: ", container);
	container.show();
	//console.log("container_post: ", container);
	
	// call menu.js
	updateMenu(tab);
	
	// toggle active in menu bar
	var nav_li = $("#tab_"+tab).parent();
	//console.log("nav_li", nav_li);
	nav_li && nav_li.addClass('active');
}

// toggle center of all elements with class "center" i.e. all divs (centers the divs unless leftWindow is shown)
function toggleCenterDivs() {
	if ($("#leftWin").is(":visible")) {
		// delete center margin of all elements with class "center" i.e. all divs
		$(".center").css("margin-left", "");
	} else {
		// add center margin to all divs with class "center" if the config window is closed
		$(".center").css("margin-left", function() {return $(window).width()/20});
	}
}

// do on resize
$(window).resize(function() {
	toggleCenterDivs();
	// prevent having lots of blue space above and below the map if the window is narrow
	// $("#map").width()/2+50: /2 because the map is 2:1 format, +50 because the zoom buttons shall not overlap the map
	$("#map").css("height", function() {return Math.min($("#map").width()/2+50, $(window).height()*0.8);});
});


/*
 * page alerts
 */

// show a bootstrap alert that will expire over time
// id is the unique name the alert will have (you can use the id to remove non-expiring alerts)
// type may be: error, success, info or block (for warning)
// head should contain the title
// expire may be true (then the alert will expire over time) or false (then it will stay unless clicked on by the user)
function showalert(id, head, message, type, expire) {

	var htmlcode = '<div id="' + id + '" class="alert alert-' +  type + '"><button type="button" class="close" data-dismiss="alert" id="errorOutput">&times;</button><h4>' + head + '</h4>' + message + '</div>';
	$('#errorOutput').append(htmlcode);

	//alert will disappear after 10 seconds if not clicked
	if (expire) {
		setTimeout(function() {
			$("#" + id).remove();
		}, 10000);
	}
}


/*
 * database error handle
 */

// output errors
socket.on("error", function (data) {
	var message = "Errno: " + data.errno + "<br>Code: " + data.code;
	showalert("dbAlert", 'Database Error!', message, 'error', true);
	// reset "Get Incidents" button (stop showing "Loading..."), disable control buttons
	$('#getIncidents').text('Get Incidents');
	$('#getIncidents').removeClass("disabled");
	disableRequestControl();
});


/*
 * draw incidents on realtime attack/database request
 */

// set markers of requested database incidents
socket.on("incidents", function (data) {
	console.log(data);

	// mark incidents with delay between the markings
	world.delayedMarking(data, live);
	
	// if no db entries are found show an error
	if (data.length == 0)
		showalert("noDataAlert", "Request Error!", "No data found for this request.", "error", true);
});

// set marks on realtime attacks
socket.on("markIncident", function(data) {
	if (live) {
		world.markIncident(data, live);
		var tableEntry = world.generateTableEntry(data);
		world.makeTableEntry(tableEntry);
	}
});


var fields;
socket.on("setFields", function(data) {
	fields = data;
	
	/* set attack types for the filter */
	var html = "";
	for(var key in data["type"]){
		html += "<option value='" + key + "'>" + data["type"][key] + "</option>";
	}
	$("#filterAttackType").html(html);
	filter.initAttackTypes();
});

socket.on("setSensors", function(sensors) {
	/* set sensor types for the filter */
	var html = "";
	for(var i = 0; i < sensors.length; i++){
		var sensortype = sensors[i];
		html += "<option value='" + sensortype + "'>" + sensortype + "</option>";
	}
	$("#filterSensorType").html(html);
	filter.initSensorTypes();
});

function typeid2str(id){
	if(fields && fields["type"].hasOwnProperty(id))
		return fields["type"][id];
	else
		return fields && fields["type"][0] || "Unknown";
}

function typeid2descr(id){
	if(fields && fields["type_description"].hasOwnProperty(id))
		return fields["type_description"][id];
	else
		return fields && fields["type_description"][0] || "";
}
