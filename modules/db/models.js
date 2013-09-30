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

exports.initialize = function(db){
	// define structure for incidents in orm-layer and export the structure
	exports.Incident = db.define(
		"incident", {
			date: Date,
			
			sensortype: String,
			sensorname: String,
			
			source_ip: String,
			source_port: { type: "number", rational: false },
			
			destination_ip: String,
			destination_port: { type: "number", rational: false },
			
			type: { type: "number", rational: false },
			log: String,
			md5sum: String,
			authorized: Boolean,
			
			source_country: String,
			source_cc: String,
			//source_region: String,
			source_city: String,
			source_latitude: { type: "number", rational: true },
			source_longitude: { type: "number", rational: true },
			
			destination_country: String,
			destination_cc: String,
			//destination_region: String,
			destination_city: String,
			destination_latitude: { type: "number", rational: true },
			destination_longitude: { type: "number", rational: true },
			
			// data: Object // JSON encoded
		},
		{
			methods: {
				/*
				fullName: function () {
					return this.name + ' ' + this.surname;
				}
				*/
			},
			validations: {
				//age: orm.validators.rangeNumber(18, undefined, "under-age")
			}
		}
	);
};
