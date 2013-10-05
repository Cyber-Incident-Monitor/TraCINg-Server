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

/*
 * database window part
 */

// TODO: was sinnvolles für hier überlegen
function requestAttackUpdate() {
	requestAttacks();
}

// get incidents
function requestAttacks() {
	if (!$('#getIncidents').hasClass("disabled")) {
		// reset progress bar
		$('.bar').css('width', 0);
	
		// reset map and table
		refreshMap();

		// show "Loading..." on "Get Incidents" button and disable button
		$('#getIncidents').text('Loading Data');
		$('#getIncidents').addClass("disabled");
		// enable control buttons
		enableRequestControl();
	
		var attackFilter = filter.getFilter();

		// get date from datepicker
		attackFilter["start"] = $("#jrange").jrange("getStartDate");
		attackFilter["end"] = $("#jrange").jrange("getEndDate");
	
		console.log("filter: ", attackFilter);
	
		socket.emit("requestAttacks", attackFilter);
	}
}

/* control buttons */

// onclick control buttons methods
$(function () {
	// stop showing data and enable a new request
	$('#stopButton').click(function (e) {
		if (!$(this).hasClass("disabled"))
			world.finishLoading(false);
	});
	// start/pause showing data from the database (toggles)
	$('#playButton').click(function (e) {
		// only change the button state if data is actually requested
		if (!$(this).hasClass("disabled")) {
			if ($('#playButton i').hasClass('icon-play')) {
				world.restartTimer();
				$('#playButton i').addClass('icon-pause');
				$('#playButton i').removeClass('icon-play');
			}
			else if ($('#playButton i').hasClass('icon-pause')) {
				world.stopTimer();
				$('#playButton i').addClass('icon-play');
				$('#playButton i').removeClass('icon-pause');
			}
		}
	});
	// lengthen the intervals in which new data from the database is shown
	$('#slowerButton').click(function (e) {
		if (!$(this).hasClass("disabled"))
			world.changeTimer(500);
	});
	// shorten the intervals in which new data from the database is shown
	$('#fasterButton').click(function (e) {
		if (!$(this).hasClass("disabled"))
			world.changeTimer(-500);
	});
	// immediately show the data from the database
	$('#showAllButton').click(function (e) {
		if (!$(this).hasClass("disabled"))
			world.resetTimer();
	});
});

// enable database request loading control buttons
function enableRequestControl() {
	$('#stopButton').removeClass('disabled');
	$('#playButton').removeClass('disabled');
	$('#slowerButton').removeClass('disabled');
	$('#fasterButton').removeClass('disabled');
	$('#showAllButton').removeClass('disabled');
}

// disable database request loading control buttons
function disableRequestControl() {
	$('#stopButton').addClass('disabled');
	$('#playButton').addClass('disabled');
	$('#slowerButton').addClass('disabled');
	$('#fasterButton').addClass('disabled');
	$('#showAllButton').addClass('disabled');
}


/*
 * database window gui functionality
 */

$(function(){
	$("#jrange").jrange();
});

// based on http://stackoverflow.com/questions/13313867/custom-button-dissapearing-from-jquery-datepicker
function addPanelSelectButton(obj) {
	setTimeout(function() {
		var buttonPane = $(obj).datepicker("widget").find(".ui-datepicker-buttonpane");
		var btn = $('<button class="ui-datepicker-current ui-state-default ui-priority-primary ui-corner-all" type="button">Select</button>');
		btn.unbind("click").bind("click", function() {
			
			setTimeout(function() {$('#hideTable').html('');}, 300);
			// write current year and month into text field on close, remember them for next time
			var month = $("#ui-datepicker-div .ui-datepicker-month :selected").val();
			var year = $("#ui-datepicker-div .ui-datepicker-year :selected").val();
			$(obj).datepicker('option', 'defaultDate', new Date(year, month));
			$(obj).datepicker('setDate', new Date(year, month));
			// set current (changed) ID for the request
			currentRequestID = "inputDateNoDay";
			
		});
		if (buttonPane.has('#customClearButton').length==0)
			btn.appendTo(buttonPane);
	}, 1);
}
