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

function jVectorMap2GeoIP(cc){
	if(cc[0] != "_")
		return cc;
	else if(cc == "_0")
		return "TR"; // Northern Cyprus -> Turkey
	else if(cc == "_1")
		return "RS"; // Kosovo -> Serbia
	else if(cc == "_2")
		return "EH"; // Western Sahara <-> Western Sahara
	else if(cc == "_3")
		return "SO"; // Somaliland -> Somalia
	else console.log("Can not map cc '"+cc+"' to GeoIP!");
}

function GeoIP2jVectorMap(cc){
	if(cc == "TR")
		return ["_0", "TR"]; // Turkey -> Northern Cyprus and Turkey
	else if(cc == "RS")
		return ["_1", "RS"]; // Serbia -> Kosovo and Serbia
	else if(cc == "EH")
		return ["_2"]; // Western Sahara <-> Western Sahara
	else if(cc == "SO")
		return ["_3", "SO"]; // Somalia -> Somaliland and Somalia
	else if($.inArray(cc,filter.allCountriesJVectorMap) != -1)
		return [cc];
	else
		return []; // not implemented in jVectorMap
}

/*
 * containing all filter options
 */
var filter = new function() {
	this.initialized = false;
	this.disableOnRegionSelected = false;

	this.allCountriesJVectorMap = []; // list of all countries from jvectormap, filled later
	this.allCountriesGeoIP = Object.keys(countryName); // list of all countries
	
	this.countries = null; // this are the currently selected countries
	this.countriesMap = null; // this are the currently selected countries from the map
	
	this.types = null; // stores selected attack types
	this.sensors = null; // stores selected sensor types
	
	this.updateCallback = null; // called on each update of a filter selection
	this.countrySelectionMap = null; // contains the jvectormap
	this.countrySelection; // contains the dropdown for countries
	
	this.authorizedCheckbox; // contains the checkbox
	this.attackTypeSelection; // contains the dropdown for attack types
	this.sensorTypeSelection; // contains the dropdown for sensor types

	this.initialize = function(){
		filter.authorizedCheckbox = $('#filterAuthorized');
		

		filter.initCountrySelection();
		
		
		/* initialize gui */
		
		$("#selectStatsCountries1").click(filter.show);
		$("#selectStatsCountries2").click(filter.show);
		
		$("#selectCountriesFinish").click(filter.finish);
	

		filter.initialized = true;
	};
	
	this.initCountrySelection = function(){
		filter.countrySelectionMap = new jvm.WorldMap({
			container: $('#selectCountriesMap'),
			map: 'world_mill_en',
			backgroundColor: 'navy',
			regionsSelectable: true,
			// show region label function
			onRegionLabelShow: function(e, el, code) {
				el.html(el.html());
	  		},
			onRegionSelected: filter.clickJVectorMap
		});
		
		// resize to prevent the map from showing up tiny
		$("#selectCountriesView").on('shown', function(){
			$("#selectCountriesView").resize();
		});
		
		html = "";
		for(var key in countryName){
			html += "<option value='"+key+"'>"+countryName[key]+"</option>";
		}
		$("#selectCountriesSelection").html(html);
		
		filter.countrySelection = $("#selectCountriesSelection").multiselect({
			selectedText: "# of # countries selected",
			noneSelectedText: "Pick countries manually by clicking on the map or choose them here",
			position: {
				my: 'left bottom',
				at: 'left top'
			},
			minWidth: 550,
			header: false,
			click: filter.clickGeoIP
		});
		
		// retrieve all countries jvectormap knows
		for(var key in filter.countrySelectionMap.regions){
			filter.allCountriesJVectorMap.push(key);
		}

		// select all countries at the beginning
		//filter.countries = filter.allCountries;
		
		
		/* initialize gui */
		
		
		
		$("#selectCountriesAll").click(filter.selectAllCountries);
		
		$("#selectCountriesClear").click(filter.clearCountries);
	}
	
	// called from main.js on socket event 'setFields'
	this.initAttackTypes = function(){
		this.attackTypeSelection = $("#filterAttackType").multiselect({
			selectedText: "# of # attack types selected",
			noneSelectedText: "Filter attack types",
			position: {
				my: 'left bottom',
				at: 'left top'
			}
		});
	};
	
	// called from main.js on socket event 'setSensorTypes'
	this.initSensorTypes = function(){
		this.sensorTypeSelection = $("#filterSensorType").multiselect({
			selectedText: "# of # sensor types selected",
			noneSelectedText: "Filter sensor types",
			position: {
				my: 'left bottom',
				at: 'left top'
			}
		});
	};

	this.show = function(){
		filter.countrySelection.val(filter.countries);
		filter.countrySelection.multiselect("refresh");
		filter.disableOnRegionSelected = true;
		filter.countrySelectionMap.setSelectedRegions(filter.countriesMap);
		filter.disableOnRegionSelected = false;

		filter.attackTypeSelection.val(filter.types);
		filter.attackTypeSelection.multiselect("refresh");

		filter.sensorTypeSelection.val(filter.sensors);
		filter.sensorTypeSelection.multiselect("refresh");

		$("#selectCountriesView").modal("show");
	};

	this.finish = function(){
		filter.countries = filter.countrySelection.val();
		filter.countriesMap = filter.countrySelectionMap.getSelectedRegions();
		
		filter.types = filter.attackTypeSelection.val();
		filter.sensors = filter.sensorTypeSelection.val();

		$("#selectCountriesView").modal("hide");
		
		if(filter.updateCallback)
			filter.updateCallback();
		else
			console.log("filter.updateCallback is null");
	};

	this.selectAllCountries = function(){
		filter.disableOnRegionSelected = true;
		filter.countrySelectionMap.setSelectedRegions(filter.allCountriesJVectorMap);
		filter.countrySelection.multiselect("checkAll");
		filter.disableOnRegionSelected = false;
	};

	this.clearCountries = function(){
		filter.disableOnRegionSelected = true;
		filter.countrySelectionMap.clearSelectedRegions();
		filter.countrySelection.multiselect("uncheckAll");
		filter.disableOnRegionSelected = false;
	};

	this.clickJVectorMap = function(e, cc, isSelected, selectedRegions){
		if(filter.disableOnRegionSelected)
			return;
		
		var geoipcc = jVectorMap2GeoIP(cc);
		filter.updateJVectorMap(geoipcc, isSelected);
		filter.updateGeoIP(geoipcc, isSelected);
	};

	this.clickGeoIP = function(e, ui){
		filter.updateJVectorMap(ui.value, ui.checked);
	};

	this.updateJVectorMap = function(cc, isSelected){
		var jVectorMapCCs = GeoIP2jVectorMap(cc);
		
		if(jVectorMapCCs && jVectorMapCCs.length > 0){
			var jVectorMapObj = {};
			for(var i = 0; i < jVectorMapCCs.length; i++){
				var _cc = jVectorMapCCs[i];
				jVectorMapObj[_cc] = isSelected;
			}
	
			filter.countrySelectionMap.setSelectedRegions(jVectorMapObj);
		}
	};

	this.updateGeoIP = function(cc, isSelected){
		var val = filter.countrySelection.val();
		if(!val) val = [];

		if(isSelected){
			val.push(cc);
		}
		else{
			var index = $.inArray(cc, val);
			if(index != -1)
				  val.splice(index, 1);
		}

		filter.countrySelection.val(val);
		filter.countrySelection.multiselect("refresh");
	}

	this.load = function(cb){
		if(!filter.initialized){
			setTimeout(function(){filter.load(cb);}, 50); // retry in 50ms
			return;
		}

		if(cb){
			filter.updateCallback = cb;
		}
		else{
			filter.updateCallback = null;
		}
	};

	this.unload = function(){
		if(!filter.initialized){
			setTimeout(filter.unload, 50); // retry in 50ms
			return;
		}

		filter.updateCallback = null;
	};
	
	this.getFilter = function(){
		var obj = {};
		
		// filter for only authorized when box is checked
		if(filter.authorizedCheckbox && filter.authorizedCheckbox.prop('checked'))
			obj["authorized"] = true;
		
		if(filter.types && filter.types.length > 0)
			obj["types"] = filter.types;

		if(filter.sensors && filter.sensors.length > 0)
			obj["sensors"] = filter.sensors;

		// do not filter countries if none or all are selected
		if(filter.countries && filter.countries.length != 0 && filter.countries.length != filter.allCountriesGeoIP.length)
			obj["countries"] = filter.countries;
		
		return obj;
	};
};

$(function(){
	filter.initialize();
});
