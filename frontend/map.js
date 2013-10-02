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

/**
 * Creates a 2d map based on jvectormaps
 * @param container			the html element where the map will be displayed
 * @param map				the name of the jvectormap map
 * @param backgroundColor	the background color of the map
 */
var map = function(container, map, backgroundColor) {
	
	var uniqueKey = 0;						// unique key for marker id
	var maxKey = 500;						// maximum amount of markers
	var incidentsPerCountry = {};			// incidents per country
	var incidents = 0;						// total sum of incidents
	var countryCode = [maxKey];				// country code of every marker
	var mapObject = new jvm.WorldMap( {		// jvectormap
		container: container,
		map: map,
		backgroundColor: backgroundColor,
		markers: [],
		series: {
			regions: [{ /* region means in our context country, as we are using a worldmap */
				// serie to display incidents per country
				attribute: "fill",
				min: -1,
				max: -2,
				scale: ['#FFFFFF', '#FF0000'],
				normalizeFunction: function(value) {
					// if min value
					if (value == -1)
						return 0;
					// if max value
					if (value == -2)
						return 1;
					// if there are no incidents return 0
					if (incidents == 0)
						return 0;
					// otherwise return (value/incidents)^(1/3)
					return Math.pow(value/incidents, 1/3);
				},
			}],
		},
		// show region label function
		onRegionLabelShow: function(e, el, code) {
			var attacks = incidentsPerCountry[code] || 0;
			if (attacks == 1)
				el.html(el.html() + " (" + attacks + " attack of " + incidents + " total)");
			else
				el.html(el.html() + " (" + attacks + " attacks of " + incidents + " total)");
  		},
  		onMarkerLabelShow: function(e, label, code) {
  			// show only standard label information if advanced information is not requested (default is advanced)
  			if (!advInfo) {
	  			var splittedName = label.text().split(";");
	  			label.html(splittedName[0]);
  			} else {
				label.html(label.text());
			}
  		}
	});
	
	/**
	 * Reset the map removing every point
	 */
	this.reset = function() {
		mapObject.removeAllMarkers();
		mapObject.series.regions[0].clear();
		uniqueKey = 0;
		incidents = 0;
		incidentsPerCountry = {};
	}
	
	/**
	 * Zoom
	 */
	this.zoom = function(value) {
		mapObject.setScale(mapObject.scale * value, mapObject.width / 2, mapObject.height / 2);
	}
	
	/**
	 * Move the map
	 */
	this.move = function(x, y) {
		var damp = mapObject.scale;
		mapObject.transX += x / damp;
		mapObject.transY += y / damp;
		mapObject.applyTransform();
	}
	
	/**
	 * Mark incident on the map
	 */
	this.addMarker = function(cc, ll, color, label) {
		// if the marker is already in use remove it first
		if (mapObject.markers[uniqueKey] != undefined) {
			removeMarker(uniqueKey);
		}
		incidents++;
		incidentsPerCountry[cc] = (incidentsPerCountry[cc] | 0) + 1;
		countryCode[uniqueKey] = cc;
		mapObject.addMarker(uniqueKey, {latLng: ll, style: {r: 5, fill: color}, name: label}, []);
		
		// redraw the region coloring
		// TODO consider doing this not on every new incident
		redrawIncidentsPerCountry();
		
		var returnMarker = uniqueKey;
		// increment key
		uniqueKey = (uniqueKey + 1) % maxKey;
		
		return returnMarker;
	}
	
	/**
	 * Remove marker
	 */
	function removeMarker(key) {
		var cc = countryCode[key];
		if (incidentsPerCountry[cc] > 0) {
			incidents--;
			incidentsPerCountry[cc] = incidentsPerCountry[cc] - 1;
			mapObject.removeMarkers([key]);
			redrawIncidentsPerCountry();
		}
		
	}
	this.removeMarker = removeMarker;
	
	/**
	 * Get the pixel position of a geographic point
	 */
	this.getPosition = function(latitude, longitude) {
		return mapObject.latLngToPoint(latitude, longitude);
	}
	
	/**
	 * Redraw incidents per country
	 */
	function redrawIncidentsPerCountry() {
		mapObject.series.regions[0].setValues(incidentsPerCountry);
	};
	
	/**
	 * State whether any country has at least one marker
	 */
	this.hasMarker = function() {
		if (incidents > 0)
			return true;
		return false;
	}
}
