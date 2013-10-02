TraCINg server
==============

A webserver gathering incidents and visualize them in multiple ways.
This product includes GeoLite data created by MaxMind, available from http://maxmind.com/

## Features ##
This server consists internally of two servers, at first a HTTPS server receiving sensor data
and at second a HTTP server serving a website to visualize these data.
Sensors are for example honeypots or intrusion detection systems (IDS) coll

The HTTP server acts like a simple webserver with static content. Dynamic content is served using
[Socket.IO](http://socket.io/).

The HTTPS servers purpose is to receive sensor data, to store them in the database and to broadcast it via
socket.io to every client currently viewing the content of the HTTP server.
The encryption is mandatory to protect the sensors identy by hiding the content of the data transmission.
This is necessary to avoid revealing the IP addresses of sensors by observing the transmitted content which
could lead to blacklisting of sensor IPs in malware.
Note that sensors are encouraged to hide their IP addresses using for example [TOR](https://www.torproject.org)
to avoid revealing their IPs by observing the traffic to the HTTPS server with the assumption that every sent
message to the HTTPS server is most likely sent from a sensor.

In order to ensure genuine sensor data an authentification is used to regocnize trustworthy sensors.
This authentification is based on a public-key infrastructure (PKI) using a certificate authority (CA) to
sign the client certificates.
The authentification is based on sending the client certificate at the TLS handshake and verifying it on the
server using the CA certificate.

Thus authorizing a sensor requires the sensor to send a certificate request to the CA and to get a valid
certificate from the CA.


## Requirements ##
### Server ###
In order to run the server one must install the following packages (preferably with
the systems package management system):
* [openssl](http://www.openssl.org/)
* [sqlite3](http://www.sqlite.org/)
* [node.js](http://nodejs.org/)

along with the following [npm](https://npmjs.org/) packages:
* [socket.io](https://npmjs.org/package/socket.io)
* [sqlite3](https://npmjs.org/package/sqlite3)
* [orm](https://npmjs.org/package/orm)
* [node-static](https://npmjs.org/package/node-static)
* [geoip](https://npmjs.org/package/geoip)
* [validator](https://npmjs.org/package/validator)

Additionally one must download the GeoLiteCity.dat file provided by MaxMind at
http://dev.maxmind.com/geoip/legacy/geolite/ and place it next to index.js.

### Website ###
In order to show th

## Usage ##
### Server ###
#### Certificates ####
To run the https server part one must provide at least a self signed server certificate
along with the corresponding private key.
To use the server to its full extent (with sensor authentification) one must prepare a
public-key infrastructure (PKI) containing a certificate authority (CA) which signs the
servers and sensors certificates.
Hence one must provide the following files:
* server certificate (signed by the CA)
* server private key
* CA certificate

Note that the certificates and private keys must be provided in the pem format.

#### Configuration file ####
The server comes with a configuration file (config.json) which must be adapted to the users preferences:
```json
{
	"db": "sqlite:///tmp/test.sqlite?debug=true",
	"geoip": "GeoLiteCity.dat",
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
* db: the path to the database storing incident data captured by sensors
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
A sensor must stick to the following JSON notation of a data entry to be sent to this server. Note that
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
This data must be sent via a POST message to the HTTPS server in order to be receipt correctly.
The sensor may send multiple datasets in one POST message each separated with a "\n".

The following table shows which data fields may be ommited and which are mandatory along with the default
values set if not provided:

| Field		| Description			| Datatype	| Example		| default value		|
|---------------|-------------------------------|---------------|-----------------------|-----------------------|
| sensor.name	| sensor name			| String	| Sensor1		| "Unknown"		|
| sensor.type	| sensor type			| String	| Honeypot		| "Unknown"		|
| src.ip	| attacker IP			| String	| 130.83.151.135	| **mandatory field**	|
| src.port	| attacker port			| Integer	| 54321			| 0			|
| dst.ip	| attacked IP (sensor IP)	| String	| 130.83.151.136	| empty string		|
| dst.port	| attacked port	(sensor port)	| Integer	| 80			| 0			|
| type		| attack type (cf. next table)	| Integer	| 11			| "Unknown"		|
| log		| attack log			| String	| TCP accept...		| empty string		|
| md5sum	| md5sum of a malware		| String	| 0e65972dce68...	| empty string		|
| date		| date of the attack		| Integer	| 1376645816		| time of the server	|

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

## Examples ##
Websites running this server:
* http://ssi.cased.de
