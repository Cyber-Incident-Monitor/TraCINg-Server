TraCINg-Server
==============

A webserver gathering malware incidents and visualizing them in multiple ways.

TraCINg (TUD Cyber Incident moNitor with TUD as an abbreviation of Technische Universität Darmstadt)
is a project proposed by Emmanouil Vasilomanolakis from [CASED](http://www.cased.de/) (Center for
Advanced Security Research Darmstadt) visualizing attacks of malware on the internet.
Attacks are observed using honeypots especially [dionaea](http://dionaea.carnivore.it/) and
[HosTaGe](https://github.com/mip-it/hostage) but can be extended to use arbitrary honeypots, intrusion detection
systems (IDS) and similar software.

This product includes GeoLite data created by MaxMind, available from http://maxmind.com/.
This Project was inspired by but is not based on [the Honeymap Project](http://map.honeycloud.net/).

## Features ##
This server consists internally of two servers: A HTTPS server receiving sensor data
and a HTTP server serving a website to visualize this data.
Sensors are honeypots (or intrusion detection systems) collecting information about attacks of malware.

The HTTP server acts like a simple webserver with static content. Dynamic content is served using
[Socket.IO](http://socket.io/).

The HTTPS servers purpose is to receive sensor data, to store them in the database and to broadcast it via
socket.io to every client currently viewing the content of the HTTP server.
The encryption is mandatory to protect the sensors identity by hiding the content of the data transmission.
This is necessary to avoid revealing the IP addresses of sensors by observing the transmitted content which
could lead to blacklisting of sensor IPs in malware.
Note that sensors are encouraged to hide their IP addresses using for example [Tor](https://www.torproject.org)
to avoid revealing their IPs in an observation of the traffic to the HTTPS server with the assumption that every sent
message to the HTTPS server is most likely sent from a sensor.

In order to receive genuine sensor data an authentification is used to recognize trustworthy sensors.
This authentification is based on a public-key infrastructure (PKI) using a certificate authority (CA) to
sign the client certificates.
The authentification is based on sending the client certificate at the TLS handshake and verifying it on the
server using the CA certificate.

Thus authorizing a sensor requires the sensor to send a certificate request to the CA and to get a valid
certificate from the CA.

## Requirements ##
### System Packages ###
In order to run the server one must install the following packages (preferably with
the systems package management system):
* [openssl](http://www.openssl.org/)
* [sqlite3](http://www.sqlite.org/)
* [node.js](http://nodejs.org/)

For example using [pacman](https://wiki.archlinux.org/index.php/pacman): `pacman -S openssl sqlite3 nodejs`

### Node Packages ###
Additionally the following [npm](https://npmjs.org/) packages are required to be installed:
* [socket.io](https://npmjs.org/package/socket.io)
* [sqlite3](https://npmjs.org/package/sqlite3)
* [orm](https://npmjs.org/package/orm)
* [node-static](https://npmjs.org/package/node-static)
* [geoip](https://npmjs.org/package/geoip)
* [validator](https://npmjs.org/package/validator)

For example using npm: `npm install socket.io sqlite3 orm node-static geoip validator`

### MaxMind GeoLiteCity Database ###
One must download the **GeoLiteCity.dat** file provided by MaxMind at
http://dev.maxmind.com/geoip/legacy/geolite/ and place it in the same folder as **index.js**.

### Website Libraries ###
To run the website one must provide several external libraries in the **frontend/extern** folder:
* [bootstrap](http://getbootstrap.com/2.3.2/)
* [jVecorMap](http://jvectormap.com/), [world map](http://jvectormap.com/maps/world/world/)
* [leaflet](http://leafletjs.com/)
* [three.js](http://threejs.org/)
* [globe.js](https://github.com/Cyber-Incident-Monitor/globe.js)
* [highcharts](http://www.highcharts.com/)
* [jQuery](http://jquery.com/)
* [jQuery UI](http://jqueryui.com/)
* [jquery-ui-multiselect-widget](http://www.erichynds.com/blog/jquery-ui-multiselect-widget)
* [jrange](https://github.com/Cyber-Incident-Monitor/jrange)
* [jquery-throttle-debounce](http://benalman.com/projects/jquery-throttle-debounce-plugin/)
* [datatables](https://datatables.net/), [datatables bootstrap plugin](http://datatables.net/blog/Twitter_Bootstrap_2) 

### Certificates ###
To run the HTTPS server part one must provide at least a self signed server certificate
along with the corresponding private key.
To use the server to its full extent (with sensor authentification) one must prepare a
public-key infrastructure (PKI) containing a certificate authority (CA) which signs the
server and sensor certificates.
Hence one must provide the following files:
* server certificate (signed by the CA)
* server private key
* CA certificate

Note that the certificates and private keys must be provided in the pem format.

### Scripts ###
One may use the fetch.sh script to download the **GeoLiteCity.dat** database and the libraries required
to run the website.
The installation of the system and node packages must be done individually.

To test the functionality one may use the provided genKeyCert.sh script which generates a ca, server,
simulator and serveral client certificate/private key pairs in the **ssl** folder. Note that these keys
are weak (only 1024bit long and not encrypted with a passphrase) and are valid for just three days.

## Usage ##
### Configuration file ###
The server comes with a configuration file (config.json) which must be adapted to the users preferences:
```json
{
	"db": "sqlite:///tmp/test.sqlite?debug=true",
	"server": {
        	"httpPort": 8888,
        	"httpsPort": 9999,
        	"webroot": "./frontend"
	},
	"ssl":  {
		"keyPath": "ssl/server_key.pem",
		"certPath": "ssl/server_cert.pem",
		"caPath": "ssl/ca_cert.pem",
		"requestCert": true,
		"rejectUnauthorized": false
	}
}
```
* db: the path to the database storing attack data monitored by sensors
* geoip: the path to the GeoLiteCity.dat file provided by MaxMind
* server:
  * httpPort: the port of the HTTP server (serving the website)
  * httpsPort: the port of the HTTPS server (receiving sensor data)
  * webroot: the webroot containing the websites content
* ssl:
  * keyPath: the path to the server private key
  * certPath: the path to the server certificate
  * caPath: the path to the CA certificate
  * requestCert: if true the server requests a certificate to check sensors authenticity
  * rejectUnauthorized: if true unauthorized sensors are rejected

## Server Interface ##
A sensor must stick to the following JSON notation of a data entry to be able to send data to this server. Note that
the data entry must be in one line and must not be separated by line breaks as shown here for a better readability:
```json
{
	"sensor": {
		"name": "sensorName",
		"type": "sensorType"
	},
	"src": {
		"ip": "sourceIP",
		"port": "sourcePort"
	},
	"dst": {
		"ip": "destinationIP",
		"port": "destinationPort"
	},
	"type": "incidentTypeID",
	"log": "incidentLog",
	"md5sum": "incidentMd5sum",
	"date": "unixTimestamp"
}
```
This data must be sent via a POST message to the HTTPS server in order to be received correctly.
The sensor may send multiple datasets in one POST message each separated with a "\n".

The following table shows which data fields may be omitted and which are mandatory along with the default
values:

| Field		| Description			| Datatype	| Example		| Default Value			|
|---------------|-------------------------------|---------------|-----------------------|-------------------------------|
| sensor.name	| sensor name			| String	| Sensor1		| "Unknown"			|
| sensor.type	| sensor type			| String	| Honeypot		| "Unknown"			|
| src.ip	| attacker IP			| String	| 130.83.151.135	| **mandatory field**		|
| src.port	| attacker port			| Integer	| 54321			| 0				|
| dst.ip	| attacked IP (sensor IP)	| String	| 130.83.151.136	| *empty string*		|
| dst.port	| attacked port	(sensor port)	| Integer	| 80			| 0				|
| type		| attack type (cf. next table)	| Integer	| 11			| "Unknown"			|
| log		| attack log			| String	| TCP accept...		| *empty string*		|
| md5sum	| md5sum of a malware		| String	| 0e65972dce68...	| *empty string*		|
| date		| date of the attack		| Integer	| 1376645816		| *unix time of the server*	|

The following table shows the association between attack type numbers and attack type definitions:

| Attack Type 	| Attack Name 		| Attack Description												|
|---------------|-----------------------|---------------------------------------------------------------------------------------------------------------|
| 0		| Unknown		| The sensor could not determine the attack type								|
| 10		| Transport Layer	| The attacker connected to an open port, but did not interact with it						|
| 11		| Portscan		| The attacker tried to connect to a closed port								|
| 20		| Shellcode Injection	| The attacker successfully used an emulated security issue and would have been able to execute malicious code	|
| 30		| SQL			| Attack on a database server											|
| 31		| MySQL			| Attack on a MySQL database server										|
| 32		| MS SQL		| Attack on a Microsoft database server										|
| 40		| SMB			| Attack on a SMB file server											|
| 50		| VoIP			| Attack on a Voice over IP device										|

Note that these attack types are based on the ability of [dionaea](http://dionaea.carnivore.it/) to distinguish between
these types of attacks.

## Examples ##
Websites running this server:
* http://ssi.cased.de
