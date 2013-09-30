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

var orm = require("orm");
var City = require("geoip").City;	// requires 'npm install geoip'
var city = new City("../../GeoLiteCity.dat");

var Models = require("./models.js");

var config = require("../../config.json");

var fields = require("../fields.js")["fields"];
var types = fields["type"];
var typeids = [];

for(var key in types){
	typeids.push(key);
}


function rand(min, max){
	return Math.floor((Math.random()*(max+1-min))+min);
}

function randIP(){
	return rand(0,255) + "." + rand(0,255) + "." + rand(0,255) + "." + rand(0,255);
}

function randType(){
	var index = rand(0,typeids.length-1);
	return typeids[index];
}


orm.connect(config.db, function (err, db) {
	if(err){
		console.log(err);
		return;
	}
	
	Models.initialize(db);
	var Incident = Models.Incident;
	
	var items = [];
	
	var max = new Date();
	var date, day = 100;
	do {
		for(var i = 0; i < 5; i++){
			date = new Date(2013, 0, day, rand(0, 23), rand(0, 59), rand(0, 59));
			
			var sip = randIP();
			var dip = randIP();
			
			var sgeo = city.lookupSync(sip);
			var dgeo = city.lookupSync(dip);
			
			if(sgeo && dgeo){
				items.push({
					date: date,
					sensortype: "test" + rand(1,9),
					sensorname: "test" + rand(1,9),
					
					source_ip: sip,
					source_port: rand(1024, 65535),
					
					destination_ip: dip,
					destination_port: 80,
					
					type: randType(),
					
					source_country: sgeo.country_name,
					source_cc: sgeo.country_code,
					source_city: sgeo.city,
					source_latitude: sgeo.latitude,
					source_longitude: sgeo.longitude,
					
					destination_country: dgeo.country_name,
					destination_cc: dgeo.country_code,
					destination_city: dgeo.city,
					destination_latitude: dgeo.latitude,
					destination_longitude: dgeo.longitude,

					authorized: rand(0, 1),
				});
			}
		}
		day++;
	} while(date < max);
	
	// store new items in the database
	Incident.create(items, function (err, items) {
			// err - description of the error or null
			if(err){
				console.log(err);
				return;
			}
			
			// items - array of inserted items
			console.log("inserted %d items", items.length);
		}
	);
});
