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
// load node modules
var fs = require("fs");

// load config
var config = require("./config.json");

// load internal modules
var server = require("./modules/server");
var postHandler = require("./modules/postHandler");
var ioListener = require("./modules/ioListener");

// read keys from filesystem
var ssl_options = {
	// server private key
	key: fs.readFileSync(config.ssl.keyPath),
	// server certificate (signed by CA)
	cert: fs.readFileSync(config.ssl.certPath),
	// CA certificate
	ca: fs.readFileSync(config.ssl.caPath),
	// require authentication by certificate
	requestCert: config.ssl.requestCert,
	// reject unauthenticated traffic
	rejectUnauthorized: config.ssl.rejectUnauthorized
};


// start the node.js server
server.start(postHandler.process, ioListener, config.server, ssl_options);
