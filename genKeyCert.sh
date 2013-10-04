#!/bin/bash

sslDir=ssl
clients=3

mkdir -p $sslDir
cd $sslDir
if [ "$(ls -A)" ]; then
	echo "The directory $sslDir is not empty. Save and remove everything in the $sslDir folder."
	echo "Aborting ..."
	exit
fi

# CA private key and certificate
echo "Creating CA private key and self signed CA certificate:"
openssl genrsa -out ca_key.pem
openssl req -new -key ca_key.pem -subj '/O=TraCINg CA/' -out ca.csr
openssl x509 -req -days 3 -in ca.csr -signkey ca_key.pem -out ca_cert.pem
rm ca.csr
echo

genKeyCert() {
	echo "Creating private key and CA signed certificate of $1"
	openssl genrsa -out ${1}_key.pem
	openssl req -new -key ${1}_key.pem -subj "/O=TraCINg/OU=Test/CN=$1" -out $1.csr
	openssl x509 -req -days 3 -in $1.csr -CA ca_cert.pem -CAkey ca_key.pem -CAcreateserial -out ${1}_cert.pem
	rm $1.csr
	echo
}

# Server private key and certificate
genKeyCert server

# Simulator private key and certificate
genKeyCert simulator
mkdir -p simulator
mv simulator_* simulator

# Client private key and certificate
for ((i=0;i<$clients;i++))
do
	genKeyCert client_$i
done

mkdir -p clients
mv client_* clients
