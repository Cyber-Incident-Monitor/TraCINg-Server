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
 * help view popovers
 */
 
// show help popovers
function showHelpPopovers() {
	titleHelp();
	mainMenuHelp();
	dbHelp();
	statsHelp();
}

// hide all help popovers i.e. stop them from showing up again, set help to false
function hideHelpPopovers() {
	help = false;
	$("[onHelpActive]").each(function(i, el) {
		$(el).popover('destroy');
	});
}


 /* Title Help*/
function titleHelp() {
	$('#header').popover({title:'Project: TraCINg', content:"This project deals with cyber attacks (mostly malware). The attacks origin is marked on one of the maps or on the table below or will be as soon as an attack occurs unless you want to view stored data and switch to database view. It might take some time for an attack to occur, so be patient. We can only show attacks aimed at our sensors (which are not marked on the map). If you need more information, go to our \"About\" or browse around the \"Help\". Have fun exploring!", trigger:trigger, placement:'bottom'});
}

/* Main Menu Help */
function mainMenuHelp() {
	// help view for "Live View"/"Database View" toggle navbar buttons
	$('#toggleView').popover({html: true, title:'Toogle View', content:"Click one of these buttons to toggle between live and dabase view. <br><strong>Live View</strong>: Shows you attacks currently detected by our sensors, updating with every attack. <br><strong>Database View</strong>: Enables you to request past attacks which will be shown on the maps and globe and in the table.", trigger:trigger, placement:'bottom'});
	
	// help view for "Country View" navbar button
	$('#2DViewEntry').popover({title:'2D Map View', content:"Click here for a 2D view of the attacks. This map shows the sources of attacks detected by our sensors. For more detailed information, hover over countries and markers. A countries color represents the number of attacks originating from there; the darker the red, the more attacks originate from this country. You can also zoom in and out using the mouse wheel and move around the map by moving the mouse while holding down the left mouse button (if zoomed in). Keyboard controls are described in the bottom left corner.", trigger:trigger, placement:'bottom'});
	
	// help view for "Map View" navbar button
	$('#StreetViewEntry').popover({title:'Streetmap View', content:"Click here for a streetmap view of the attacks (also in 2D). This map shows the sources of attacks detected by our sensors. For more detailed information, click the markers. Coloring and country hover is not supported here. You can also zoom in and out using the mouse wheel and move around the map by moving the mouse while holding down the left mouse button. Keyboard controls are described in the bottom left corner.", trigger:trigger, placement:'bottom'});
	
	// help view for "3D View" navbar button
	$('#3DViewEntry').popover({title:'3D Globe View', content:"Click here for a 3D view of the attacks. This globe shows the sources of attacks detected by our sensors. For more detailed information, hover over countries and markers. A countries color represents the number of attacks originating from there; the darker the red, the more attacks originate from this country. Toggle a heatmap by pressing \"t\" on your keyboard. You can also zoom in and out using the mouse wheel and move the globe by moving the mouse while holding down the left mouse button. Keyboard controls are described in the bottom left corner.", trigger:trigger, placement:'bottom'});
	
	// help view for "Table View" navbar button
	$('#tableViewEntry').popover({title:'Table View', content:"Click here for a table representation of the attack data received from the sensors. This table always shows exactly the attacks which are currently represented on the maps/globe (no less, no more). This behavior is independent from live or database view. Hover over the entries in \"Attack Types\" to learn more about them.", trigger:trigger, placement:'bottom'});
	
	// help view for "Statistics" navbar button
	$('#statsEntry').popover({title:'Statistic View', content:"Click here for a statistic on our assembled attack data. The top left pie chart gives you an overview of the relative distribution of the number of attacks given attack types or countries. The major statistic shows the number of attacks by type or country over time (addatively).", trigger:trigger, placement:'bottom'});
	
	// help view for "Help" navbar button itself if hover is required for help views to show up
	var helpText;
	if (trigger == "hover")
		helpText = "To view helpful information hover over the elements (marked with a green frame). Click \"Help\" again to deactivate the information display."
	if (trigger == "click")
		helpText = "To view helpful information click the elements (marked with a green frame). Click \"Help\" again to deactivate the information display."
	if (trigger == "focus")
		helpText = "To view helpful information focus the elements (marked with a green frame). Click \"Help\" again to deactivate the information display."	
	$('#helpEntry').popover({title:'Help', content:helpText, trigger:trigger, placement:'bottom'});
	
	// help view for "About" navbar button
	$('#aboutViewEntry').popover({title:'About View', content:"Click here for information about the project, about what you see on the page and which software is being used.", trigger:trigger, placement:'bottom'});
	
	// help view for "Advanced Marker Info" button
	$('#advMarkerInfo').popover({title:'Display Advanced Marker Information', content:"Activate this button to get more information on marker hover. Deactivate it to show less information.", trigger:trigger, placement:'bottom'});
	
	// help view for "Reset Map" button
	$('#resetMap').popover({title:'Reset Map Button',content:"Click here to reset the map, i.e. delete all markers plus marker and region information and change the region coloring to default. The table will also be cleared in the progress.", trigger:trigger, placement:'bottom'});
}

/* Database Help */
function dbHelp() {
	// help view for Datepicker
	$('#jrange').popover({title:'Datepicker', content:"Click here to open a datepicker and choose a date for a request. You may select a single day or a range of days by clicking either one day or a start and end day. You can pick a range longer than a month. The \"Done\" button will save your selection and close the datepicker. If you have not selected anything the selection will not change. If you want to choose the current month you can click on \"Select Month\". Click on the \"Get Incidents\" button to start the request or use \"Filter\" at the bottom.", trigger:trigger, placement:function(){if ($(window).width() < 980){return 'bottom'} else {return 'right'}}});
	
	// help view for "Get Incidents" button
	$('#getIncidents').popover({html:"true",title:'Request Incidents Button (resets map automatically)',content:"Click here to load the entries from the Database which correspond to the request specified in the above menu. If no request is specified todays attack data will be requested automatically. The attacks will load one after the other starting with the first of the day so you may interact with the loading progress using the control buttons below. <br> <strong>Warning: This will reset the map, i.e. delete all markers plus marker and region information and change the region coloring to default!</strong>", trigger:trigger, placement:function(){if ($(window).width() < 980){return 'bottom'} else {return 'right'}}});
	
	// help view for loading progress bar
	$('#loadingProgressBar').popover({title:"Request Progress Bar",content:"This bar will show you the progress of your database request, i.e. the percentage of the data which is already shown.", trigger:trigger, placement:function(){if ($(window).width() < 980){return 'bottom'} else {return 'right'}}});
	
	// help view for stop button
	$('#stopButton').popover({title:"Stop Request",content:"Click here to cancel the request so you will be able to make a new request. It will not reset the map automatically. Note: Switching back to live view will always stop the loading progress!", trigger:trigger, placement:function(){if ($(window).width() < 980){return 'top'} else {return 'right'}}});
	
	// help view for play/pause button
	$('#playButton').popover({title:"Pause or Play Data",content:"Click here to toggle between pause and play which enables you to pause the loading, explore the maps/globe, table etc. and start the request from where you paused it again whenever you like. This will not work however, if you switch back to the live view because switching to live view will stop the loading progress!", trigger:trigger, placement:function(){if ($(window).width() < 980){return 'top'} else {return 'right'}}});
	
	// help view for loading faster/slower button
	$('#fasterSlowerButton').popover({title:"Speed Control",content:"These buttons enable you to control the loading speed in which database requests show. The left button will slow down the speed with which attacks will be shown, the right button will make it faster.", trigger:trigger, placement:function(){if ($(window).width() < 980){return 'top'} else {return 'right'}}});
	
	// help view for "Show All" button
	$('#showAllButton').popover({title:"Show All Data At Once",content:"Click here to immediately load all the data.", trigger:trigger, placement:function(){if ($(window).width() < 980){return 'top'} else {return 'right'}}});
	
	// help view for database "Filter" button
	$('#selectStatsCountries2').popover({html: true, title:"Filter Request", content:"Click here to open a filter menu to do a customized request. <br> <strong>Warning: This will reset the map, i.e. delete all markers plus marker and region information and change the region coloring to default!</strong>", trigger:trigger, placement:'top'});
}

/* Statistics Help */
function statsHelp() {
	// help view for "by Type" Button
	$('#getStatstypeDate').popover({title:'Show Timeline of attacks by Type', content:"Click here to show a statistic of the number of attacks over time by attack type.", trigger:trigger, placement:function(){if ($(window).width() < 980){return 'top'} else {return 'right'}}});
	
	// help view for "by Country" Button
	$('#getStatscountryDate').popover({title:'Show Timeline of attacks by Country', content:"Click here to show a statistic of the number of attacks over time by country (from which the attack originated).", trigger:trigger, placement:function(){if ($(window).width() < 980){return 'top'} else {return 'right'}}});
	
	// help view for timeline
	$('#chartdivmaster').popover({title:"Timeline",content:"This timeline shows a miniature graph of all available database data. Click and drag the mouse here to show a more detailed excerpt of the data. The time range you choose will be marked in orange and the statistics graph will update to show you the data that has been collected within the orange timespan.", trigger:trigger, placement:'top'});
	
	// help view for statistics "Filter" button
	$('#selectStatsCountries1').popover({title:"Filter Graph", content:"Click here to open a filter menu to customize the statistics graph.", trigger:trigger, placement:function(){if ($(window).width() < 980){return 'top'} else {return 'right'}}});
}
