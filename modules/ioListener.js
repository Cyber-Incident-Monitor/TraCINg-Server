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
 * This module provides a real time connection service by socket.io
 */
var socketio = require("socket.io");
// custom modules
var db = require("./db/db.js");

var fields = require("./fields.js");


function listen(server) {
	
	io = socketio.listen(server);

	io.sockets.on("connection", function (socket) {
		socket.emit("setFields", fields.fields);

		db.getSensorTypes(function(err, sensors){
			console.log(arguments);
			
			if (err) {
				socket.emit("error", err);
				return;
			}
			
			socket.emit("setSensors", sensors);
		});

		socket.on("requestAttacks", function (filter) {
			console.log("requestAttacks:", filter);
			try{
				db.requestAttacks(filter, function(err, data){
					if (err) {
						socket.emit("error", err);
						return;
					}
					
					// TODO use socket callback instead of the socket event
					socket.emit("incidents", data);
				});
			}
			catch(e){
        	    console.log("Internal error. " + e);
				console.log(e.stack);
				socket.emit("error", {code: "internal error"});
			}
		});
		
		socket.on("getLog", function (data, socketCallback) {
			console.log("getLog");
			console.log(data);
			try{
				db.getLog(parseInt(data), function(err, data){
					if (err) {
						socket.emit("error", err);
					}
					// socket callback also on error
					socketCallback(data);
				});
			}
			catch(e){
        	    console.log("Internal error. " + e);
				console.log(e.stack);
				socket.emit("error", {code: "internal error"});
			}
		});
		
		socket.on("getStatistics", function (options, socketCallback) {
			console.log("getStatistics", options);
			try{
				db.getStatistics(options, function(err, data){
					if(err){
						socket.emit("error", err);
						return;
					}
					
					socketCallback(data);
				});
			}
			catch(e){
        	    console.log("Internal error. " + e);
				console.log(e.stack);
				socket.emit("error", {code: "internal error"});
			}
		});
	});
	
	return io;
}


exports.listen = listen;
