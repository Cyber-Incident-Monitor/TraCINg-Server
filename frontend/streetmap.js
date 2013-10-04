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

// based on http://switch2osm.org/using-tiles/getting-started-with-leaflet/
var streetmap = function(container) {

	var stmap = new L.Map(container);	// set up the map
	stmap.keyboard.disable();			// deactivate native keybindings
	var maxKey = 500;					// maximum amount of markers
	var markerArray = [maxKey];			// array containing all markers
	var uniqueKey = 0;					// unique key for marker id
	var holdTime = 100;					// time in ms until a label disappears
	var incidents = 0;					// total sum of incidents
	
	// create the tile layer with correct attribution
	var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var osmAttrib='Map data © OpenStreetMap contributors';
	// initStreetMap
	var osm = new L.TileLayer(osmUrl, {attribution: osmAttrib, noWrap: true, minZoom: 1});

	/* set a bounding box for the map which is as large as the world and does not allow movement beyond
	 * (this is sort of buggy and does not work with "setView" when the setView zoom level is the same as
	 * the max zoom through maxBound, thus if this shall be used, set the zoom level to 4 and adjust
	 * lat/lng if desired; enabling this also makes the Layer attribute noWrap less useful)
	 */
	//stmap.setMaxBounds(new L.LatLngBounds(new L.LatLng(-90, -190), new L.LatLng(90, 190)));
	stmap.setMaxBounds(new L.LatLngBounds(new L.LatLng(-190, -290), new L.LatLng(190, 290)));
	
	// start the map
	// first argument: lat/lng; second argument: zoom (the smaller the farther away)
	stmap.setView(new L.LatLng(35, 0), 3, {animate: false});
	stmap.addLayer(osm);
	
	/*
	 * mark incident on the map
	 */
	this.addMarker = function(ll, color, label) {
		
		incidents++;
		
		// create a marker (leaflet circle)
		var size = 500; // 500 meter circle
		var latLng = new L.LatLng(ll[0], ll[1]);
		var circle = L.circle(latLng, size, { color: color, fillColor: color, fillOpacity: 0.5 });
		
		//markerArray.splice(uniqueKey, 0, circle); FIXME remove me
		circle.addTo(stmap);
		
		// create a popup that will not receive focus on creation (i.e. no autoPan)
		var popup = new L.Popup({autoPan: false}).setContent(label);
		circle.bindPopup(popup);
		
		// show more information in popup on click
		//var clickedMarker;
		//circle.on("click", function(e) {clickedMarker = this; this._popup.setContent(advLabel); this.openPopup();});
		
		// show popup on mousehover, hide popup on mouseout
		var stmapHoverTimer;
		
		circle.on("mouseover", function(e) {
			// show standard or advanced label information depending on which is requested
			var splittedLabel = label.split(";");
			if (advInfo)
				this._popup.setContent(label);
			else
				this._popup.setContent(splittedLabel[0]);
			this.openPopup();
			
			var marker = this;
			
			// define mouseleave events
			popup._container.addEventListener("mouseleave", function(e) {stmapHoverTimer = setTimeout(function() {marker.closePopup()}, holdTime)});
			
			// define mouseenter events
			popup._container.addEventListener("mouseenter", function(e) {clearTimeout(stmapHoverTimer);});
			
		});
		
		// remove a previously defined marker with the same key
		removeMarker(uniqueKey);
		
		// add the circle to the marker array to be able to remove it
		markerArray[uniqueKey] = circle;
		
		var returnMarker = uniqueKey;
		uniqueKey = (uniqueKey + 1) % maxKey;
		return returnMarker;
	}
	
	/*
	 * remove marker
	 */
	function removeMarker(key) {
		if (markerArray[key] != undefined) {
			stmap.removeLayer(markerArray[key]);
			markerArray[key] = undefined;
		}
	}
	this.removeMarker = removeMarker;
	
	/*
	 * remove all markers
	 */
	this.reset = function() {
		for (var i = 0; i < markerArray.length; i++) {
			removeMarker(i);
		}
		uniqueKey = 0;
		incidents = 0;
	}
	
	/*
	 * get marker position (lat/lng to point) for css animation
	 */
	this.getPosition = function(latitude, longitude) {
		return stmap.latLngToContainerPoint(new L.LatLng(latitude, longitude));
	}
	
	/*
	 * Zoom the streetmap
	 */
	this.zoom = function(value) {
		stmap.zoomIn(value);
	}
	
	/*
	 * Move the streetmap
	 */
	this.move = function(x, y) {
		stmap.panBy([-x, -y]);
	}
	
	/*
	 * State whether any country has at least one marker
	 */
	this.hasMarker = function() {
		if (incidents > 0)
			return true;
		return false;
	}
}

// based on http://stackoverflow.com/questions/10762984/leaflet-map-not-displayed-properly-inside-tabbed-panel
// a rather ugly solution for the "gray map on load" problem
$(function() {
	$("body").on('shown','#StreetViewEntry', function() { 
		stmap.invalidateSize(false);
	});
});
