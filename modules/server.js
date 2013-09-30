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
 * This module defines a http server with a static webroot and a https server
 * cappable of receiving POST data. Additionally a socket.io listener provides
 * realtime connection between server and clients.
 */

// load node modules
var http = require("http");
var https = require("https");
var statics = require("node-static");	// requires 'npm install node-static'

function start(postHandle, ioListener, config, options) {
	
	// http request
	function onRequestHttp(request, response) {
		console.log("http request received.");
		//serve files
		fileServer.serve(request, response);
	}

	// https request (POST only, no routing)
	function onRequestHttps(request, response) {
		var postData = "";
		console.log("https request received.");
		
		var authorized = request.client.authorized;
		var sensor = {};

		var clientCert = request.connection.getPeerCertificate();
		if(clientCert && clientCert.subject){
			sensor["name"] = clientCert.subject.CN;
			sensor["type"] = clientCert.subject.O;
			if(clientCert.subject.OU){
				sensor["type"] += " " + clientCert.subject.OU;
			}

			console.log("Sensor information retrieved from client certificate: ", sensor);
		}
		
		// receive POST data
		request.on("data", function(chunk) {
			postData += chunk;
			// prohibit too large POST data
			if(postData.length > 1e6) {
				response.writeHead(413, {"Content-Type": "text/plain"});
				response.write("Request Entity Too Large");
				response.end();
				request.connection.destroy();
			}
		});
		
		// process received Data
		request.on("end", function() {
			// TODO: client cert name?
			postHandle(response, postData, authorized, sensor, io);
		});
	}
	
	// http Server
	var server = http.createServer(onRequestHttp).listen(config.httpPort);
	// file Server serving files from a specific folder
	var fileServer = new(statics.Server)(config.webroot, {cache:10});	// TODO remove cache time - test purpose
	// https Server
	var postReceiver = https.createServer(options, onRequestHttps).listen(config.httpsPort);
	// io sockets listener (listens on same port as the http server)
	var io = ioListener.listen(server);
	console.log("Server has started.");
}

exports.start = start;
