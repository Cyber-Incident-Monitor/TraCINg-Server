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
 * This module provides methods of receiving POST data and storing them in a
 * database. Additionally it is send via socket.io to every client connected to
 * the server.
 */
// load node modules
var City = require("geoip").City;	// requires 'npm install geoip' and on ubuntu 'aptitude install libgeoip-dev'
var city = new City("GeoLiteCity.dat");

// load internal modules
var db = require("./db/db.js");

var debugInstance = 0;
var Debug = function(){
	var output = "";
	var instance = debugInstance++;

	this.get = function(){
		return output;
	};

	this.add = function(text){
		text = "PostHandler["+instance+"]: " + text;
		console.log(text);
		output += text + "\n";
	};
};

// process incomding data, respond with a status code, broadcast the received
// data and store the data in a database 
function process (response, postData, authorized, sensor, io) {
	var debug = new Debug();
	debug.add("Processing " + (authorized?"authorized":"unauthorized") + " incoming data"); // "from '" + response.connection.remoteAddress + "'"

	if(postData.length == 0) {
		debug.add("Received no POST data.");
		response.writeHead(400, {"Content-Type": "text/plain"});
		response.write(debug.get());
		response.end();
	}
	else {
		try {
			var items = [];

			var lines = postData.trim().split("\n");
			debug.add("got " + lines.length + " line(s)");
			
			for(var i = 0; i < lines.length; i++){
				try {
					var parsedData = JSON.parse(lines[i].trim());
					
					// get geodata from ip
					var ipa, ipd;
					ipa = city.lookupSync(parsedData.src.ip);
					if(parsedData.dst)
						ipd = city.lookupSync(parsedData.dst.ip);
					
					// generate data
					var data = {
						sensorname: sensor.name || parsedData.sensor && parsedData.sensor.name || "Unknown",
						sensortype: sensor.type || parsedData.sensor && parsedData.sensor.type || "Unknown",
						src: {
							ip: parsedData.src.ip,
							port: parsedData.src && parsedData.src.port && (parsedData.src.port > 0) && (parsedData.src.port < 65535) && parsedData.src.port || 0,
						},
						dst: {
							ip: parsedData.dst && parsedData.dst.ip || null,
							port: parsedData.dst && parsedData.dst.port && (parsedData.dst.port > 0) && (parsedData.dst.port < 65535) && parsedData.dst.port || 0,
						},
						type: parsedData.type || 0,
						log: parsedData.log || null,
						md5sum: parsedData.md5sum || null,
						date: parsedData.date && new Date(parsedData.date*1000) || new Date(), // now
						authorized: authorized,
					};
	
					if(ipa){
						data.src["ll"] = [ipa.latitude, ipa.longitude];
						data.src["country"] = ipa.country_name;
						data.src["cc"] = ipa.country_code;
						data.src["city"] = ipa.city || "";
					}
					
					if(ipd){
						data.dst["ll"] = [ipd.latitude, ipd.longitude];
						data.dst["country"] = ipd.country_name;
						data.dst["cc"] = ipd.country_code;
						data.dst["city"] = ipd.city || "";
					}
		
					// mark if attack ip is extern
					// add to database
					//if (ipa != null && ipd != null) {
					if (ipa) {
						// insert calls insertCallback which calls socket.emit
						items.push(data);
					}
					else {
						debug.add("An invalid source IP occured in line " + i + ": " + parsedData.src.ip + " (need to be a valid IP that could be resolved to a location via GeoIP)");
					}
	
				}
				catch (e) {
					debug.add("Received invalid JSON data in line " + i + ": " + e);
					debug.add("JSON String: " + lines[i].trim());
				}
			}
			
			if(items.length > 0){
				debug.add("try to insert " + items.length + " item(s) to the database");
				db.insert(items, function(err, items) {
					//console.log("dbInsertCallback", arguments);
					
					if(err){
						debug.add("dbInsert error: " + err);
						response.writeHead(400, {"Content-Type": "text/plain"});
					}
					else if(!items || items.length == 0){
						debug.add("no items inserted to the database");
						response.writeHead(400, {"Content-Type": "text/plain"});
					}
					else{
						debug.add("successfully inserted " + items.length + " item(s) to the database");
						response.writeHead(200, {"Content-Type": "text/plain"});
					}
					
					response.write(debug.get());
					response.end();
					
					if(!err){
						for(var i = 0; i < items.length; i++){
							io.sockets.emit("markIncident", items[i]);	// TODO send as one packet / one array
						}
					}
				});
			}
			else{
				debug.add("no items left to insert to the database!");
				response.writeHead(400, {"Content-Type": "text/plain"});
				response.write(debug.get());
				response.end();
			}
		}
		catch (e) {
			debug.add("Received invalid POST data. " + e);
			debug.add(e.stack);
			response.writeHead(400, {"Content-Type": "text/plain"});
			response.write(debug.get());
			response.end();
		}
	}
}

exports.process = process;
