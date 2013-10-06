TraCINg-Server
==============

A webserver gathering malware incidents and visualizing them in multiple ways.

TraCINg (TUD Cyber Incident moNitor with TUD as an abbreviation of Technische Universität Darmstadt)
is a project proposed by Emmanouil Vasilomanolakis from [CASED](http://www.cased.de/) (Center for
Advanced Security Research Darmstadt) visualizing attacks of malware on the internet.
Attacks are observed using honeypots especially the honeypot [dionaea](http://dionaea.carnivore.it/)
in conjunction with [jsonfeeds](https://github.com/Cyber-Incident-Monitor/jsonfeeds) and
the honeypot [HosTaGe](https://github.com/mip-it/hostage) but can be extended to use arbitrary
honeypots, intrusion detection systems (IDS) and similar software.

This product includes GeoLite data created by MaxMind, available from http://maxmind.com/.  
This project was inspired by but is not based on the [Honeynet Project](http://map.honeynet.org/).

## Features ##
### Backend ###
This backend consists internally of two servers: A HTTPS server receiving sensor data
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

### Frontend ###
The website visualizes attacks caused by malware on the internet in the later described five ways. Incidents
can be shown live if in **Live-View** or retrieved by a database query if in **Database-View**. Additional features
are an about and help screen informing and guiding respectively the user.

#### 2D Country Map ####
The country map shows a map only containing country borders.
It can be moved and zoomed either with the mouse or the keyboard.  
Attacks are shown as a marker in the country where the attack originated. Hovering the markers shows information
about this specific attack and how many attacks where originated from the same place.  
Additionally countries are colored in a red tone depending on the ratio of markers in that country.

#### 2D Street Map ####
The street map behaves much like the 2D Country Map but omits coloring of the countries and shows a
more detailed map using [OpenStreetMap](http://www.openstreetmap.org/) map material.

#### 3D Globe ####
The globe behaves much like the 2D Map in the 3D space with the enhancement of adding a heatmap-like
view of the markers.

#### Table View ####
The table view shows a sort- and searchable table containing information about each attack.

#### Statistics ####
The statistics shows either the number of attacks per country over a specific time span or the number of
attack types in a specific time span. The data can be filtered by several ways:
* show only authorized sensors data
* select countries
* select attack types
* select sensor types
Note that statistics can only be applied to data querried from the database.

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

### Website Libraries ###
To run the website one must provide several external libraries (at least the javascript and css files)
in the **frontend/extern** folder:
* [bootstrap](http://getbootstrap.com/2.3.2/) (including images)
* [jVecorMap](http://jvectormap.com/), [world map](http://jvectormap.com/maps/world/world/)
* [leaflet](http://leafletjs.com/) (including images)
* [globe.js](https://github.com/Cyber-Incident-Monitor/globe.js) (including images), requires [three.js](http://threejs.org/)
* [highcharts](http://www.highcharts.com/)
* [jQuery](http://jquery.com/)
* [jQuery UI](http://jqueryui.com/) (including images)
* [jquery-ui-multiselect-widget](http://www.erichynds.com/blog/jquery-ui-multiselect-widget)
* [jrange](https://github.com/Cyber-Incident-Monitor/jrange)
* [jquery-throttle-debounce](http://benalman.com/projects/jquery-throttle-debounce-plugin/)
* [datatables](https://datatables.net/) (including images), [datatables bootstrap plugin](http://datatables.net/blog/Twitter_Bootstrap_2)

Instead of installing all these libraries manually we encourage you to use the provided
[fetch.sh](https://raw.github.com/Cyber-Incident-Monitor/TraCINg-Server/master/fetch.sh)
script to download them along with the MaxMind GeoLiteCity database described in the next section.

### MaxMind GeoLiteCity Database ###
One must download the **GeoLiteCity.dat** file provided by MaxMind at
http://dev.maxmind.com/geoip/legacy/geolite/ and place it in the same folder as **index.js**.

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

To test the functionality one may use the provided
[genKeyCert.sh](https://raw.github.com/Cyber-Incident-Monitor/TraCINg-Server/master/genKeyCert.sh)
script which generates CA, server, simulator and serveral client certificate/private key pairs in
the **ssl** folder. Note that these keys are weak (only 1024 bit long and not encrypted with a passphrase)
and are valid for just three days.

## Usage ##
To start the server execute `node index.js`. If the servers private key is encrypted you must unlock the
key by entering the passphrase.  
One may use the [simulator](https://github.com/Cyber-Incident-Monitor/TraCINg-Server/blob/master/simulator.py)
(requires python 3 along with the [Requests library](http://docs.python-requests.org/en/latest/)) to simulate
an sensor thus testing the functionality of the server.

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
