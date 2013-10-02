server
======

A webserver gathering incidents and visualize them in multiple ways.
This product includes GeoLite data created by MaxMind, available from http://maxmind.com/

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


