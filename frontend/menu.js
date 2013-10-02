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

var help = false;		// states whether help is active
var live = true;		// states whether live or database view is active
var trigger = "hover";	// states whether the help popovers will show on hover (or click -> on click|focus -> on focus)

/*
set content of leftContent to div with given id and hide other divs
*/
function setLeftContent(id) {
	$("#leftWin").children("div").each(function(n, el) { // for each direct children
			if(el.id == id)
				$(el).show();
			else
				$(el).hide();
		}
	);
}



function updateMainWidth() {
	$("[LeftWinAdd], [LeftWinRemove]").each(function(i, el) {
		var leftWinAdd = $(el).attr("LeftWinAdd");
		var leftWinRemove = $(el).attr("LeftWinRemove");

		if ($("#leftWin").is(":visible")) {
			// remove center margin of divs
			toggleCenterDivs();
			// remove class we should remove and add the class we should add
			$(el).removeClass(leftWinRemove);
			$(el).addClass(leftWinAdd);
		} else {
			// reverse above
			$(el).removeClass(leftWinAdd);
			$(el).addClass(leftWinRemove);
			toggleCenterDivs();
		}
	});
}

function updateWins(leftContent, leftVisible, toggleVisible, filterUpdateCallback) {
	setLeftContent(leftContent);
	if (leftVisible)
		$("#leftWin").show();
	else
		$("#leftWin").hide();
	if (toggleVisible) {
		//$("#toggleView").show();
		$("#liveView").removeClass("disabled");
		$("#dbView").removeClass("disabled");
	} else {
		//$("#toggleView").hide();
		$("#liveView").addClass("disabled");
		$("#dbView").addClass("disabled");
	}

	// TODO: was geschickteres überlegen als an zwei stellen den filter callback für die Datenbankansicht zu setzen
	if(filterUpdateCallback){
		filter.load(filterUpdateCallback);
	}
	else{
		filter.unload();
	}

	updateMainWidth();
}

// show extra borders for elements if help is active to be able to see which elements to hover
function updateHelpElements() {
	$("[onHelpActive]").each(function(i, el) {
		var onHelp = $(el).attr("onHelpActive");

		if (help) {
			// add the class we should add
			$(el).addClass(onHelp);
		} else {
			// reverse above
			$(el).removeClass(onHelp);
		}
	});
}

/*
 * menu functionality (navbar and toggle buttons)
 * includes: make navbar buttons toggleable (except help and about as they do not (yet) change the side content)
 */
function updateMenu(tab){
		// "2D View" entry chosen via hash, show 2D map
	    if (tab == 'map') {
	    	world.showMap();
	    	// if there is no attack data show an info alert
			if (!world.jvmHasMarker())
				showInfoNoData();
			// if there is attack data remove the info alert
			else
				$("#tableWaitingAlert").remove();
	    	// set help if active
	    	if (help)
		    	$("#helpEntry").addClass("active");
			// resize map before showing it to prevent it from showing up tiny
		    $("#map").resize();

			// set left window and toogleLive
			updateWins("dbWin", !live, true, !live && requestAttackUpdate);
			$("#advMarkerInfo").removeClass("disabled");
			$("#resetMap").removeClass("disabled");
		}
		// "Street View" entry chosen via hash, show streetmap
		else if (tab == 'streetmap') {
			world.showStreetmap();
			// if there is no attack data show an info alert
			if (!world.stMapHasMarker())
				showInfoNoData();
			// if there is attack data remove the info alert
			else
				$("#tableWaitingAlert").remove();
			if (help)
				$("#helpEntry").addClass("active");
			
			updateWins("dbWin", !live, true, !live && requestAttackUpdate);
			$("#advMarkerInfo").removeClass("disabled");
			$("#resetMap").removeClass("disabled");
		}
		// "3D View" entry chosen via hash, show 3D map
		else if (tab == 'globe') {
			world.showGlobe();
			// if there is no attack data show an info alert
			if (!world.globeHasMarker())
				showInfoNoData();
			// if there is attack data remove the info alert
			else
				$("#tableWaitingAlert").remove();
			if (help)
				$("#helpEntry").addClass("active");
			
			updateWins("dbWin", !live, true, !live && requestAttackUpdate);
			$("#advMarkerInfo").removeClass("disabled");
			$("#resetMap").removeClass("disabled");
		}
		// "Table View" entry chosen via hash, show table
		else if (tab == 'table') {
			world.leaveMap();
			if (help)
		    	$("#helpEntry").addClass("active");
		    // if there is no attack data show an info alert
		    if ($("#table table tbody tr").length == 0)
		    	showInfoNoData();
			// if there is attack data remove the info alert
			else
				$("#tableWaitingAlert").remove();
			
			updateWins("dbWin", !live, true, !live && requestAttackUpdate);
			$("#advMarkerInfo").addClass("disabled");
			$("#resetMap").removeClass("disabled");
		}
		// "Statistics" entry chosen via hash, show statistics
		else if (tab == 'stats') {
			world.leaveMap();
			// remove alert
	    	$("#tableWaitingAlert").remove();
			if (help)
				$("#helpEntry").addClass("active");
			
			updateWins("statsWin", true, false, filterUpdateStats);

			var chartsCreated = createCharts();
			// reload charts, the filter could have been changed on another tab
			if (!chartsCreated)
				filterUpdateStats();

			$("#advMarkerInfo").addClass("disabled");
			$("#resetMap").addClass("disabled");
		}
		else console.log('menue: unknown tab: ' + tab);
};
		
$(function () {
		// "Help" entry chosen in menu -> toggle entry tab, show help popovers
		$('#helpEntry a').click(function (e) {
			e.preventDefault();
			if (help) {
				help = false;
				$("#helpEntry").removeClass("active");
				hideHelpPopovers();
			} else {
				help = true;
				$("#helpEntry").addClass("active");
				showHelpPopovers();
				$('#helpEntry').popover('show');
				
			}
			updateHelpElements();
		});
		
		// "Live View" entry chosen in toggle button menu -> switch to live view, hide side/database window
		$('#liveView').click(function (e) {
			if (!$(this).hasClass("disabled")) {
				live = true;
				$(leftWin).hide();
				setLeftContent("dbWin");
				filter.unload();
				updateMainWidth();
				if (help)
					showHelpPopovers();
				// stop loading data if loading is in progress
				world.finishLoading(false);
				$("#liveView").addClass("active");
				$("#dbView").removeClass("active");
			}
		});
		// "Database View" entry chosen in toggle button menu -> switch to database view, show side/database window
		$('#dbView').click(function (e) {
			if (!$(this).hasClass("disabled")) {
				live = false;
				$(leftWin).show();
				setLeftContent("dbWin");
				filter.load(requestAttackUpdate);
				updateMainWidth();
				if (help)
					showHelpPopovers();
				$("#dbView").addClass("active");
				$("#liveView").removeClass("active");
			}
		});
		// "Advanced Marker Information" entry chosen in menu -> show more information on hover over markers
		$('#advMarkerInfo').click(function (e) {
			if (!$(this).hasClass("disabled")) {
				if (advInfo == true) {
					advInfo = false;
					$("#advMarkerInfo").removeClass("active");
				} else {
					advInfo = true;
					$("#advMarkerInfo").addClass("active");
				}
			}
		});
		$('#resetMap').click(function (e) {
			if (!$(this).hasClass("disabled")) {
				refreshMap();
			}
		});
});

// show "no data" alert
function showInfoNoData() {
	// show an alert if none exists
	if (!$("#tableWaitingAlert").length > 0) {
		showalert("tableWaitingAlert", "Waiting for data...", "Once attacks occur or are requested in the dabase view they will show up below. To display attacks on both maps and the globe you need to load them separately (i.e. click their menu entry once). Otherwise they will stay empty even if attacks occur until you load them.", "info", false);
	}
}

// reset map and table
function refreshMap() {
	// show "no data" alert if map, globe or table is active
	if (!$("#stats").is(":visible"))
		showInfoNoData();
	// reset maps and table
	world.reset();
	world.resetTable();
}


// allow keyboard control in about view (modal)
// based on http://stackoverflow.com/questions/16718443/use-keyboard-to-scroll-in-twitters-bootstrap-2-x-modal-popup
$(function () {
	$('#aboutView').keydown(function(e) {
		// scroll up and down in the modal
		var speed = 50;		// scroll speed
		if (e.keyCode == 40) {
			e.preventDefault();
			$('.modal-body').scrollTop($('.modal-body').scrollTop() + speed);
		}
		if (e.keyCode == 38) {
			e.preventDefault();
			$('.modal-body').scrollTop($('.modal-body').scrollTop() - speed);
		}
	});
	// Disable key control of the maps/globe if modal is active
	$('#aboutView').on('show', function(e) {world.toggleEnabled();});
	$('#aboutView').on('hide', function(e) {world.toggleEnabled();});
});

