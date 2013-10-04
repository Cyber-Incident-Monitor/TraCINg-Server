# TraCINg-Server - Gathering and visualizing cyber incidents on the world
#
# Copyright 2013 Matthias Gazzari, Annemarie Mattmann, André Wolski
# 
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
#     http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import requests
import json
import random
import time
import sys
import argparse
import time
import datetime

# based on http://stackoverflow.com/questions/10218486/set-nested-dict-value-and-create-intermediate-keys
from collections import defaultdict
recursivedict = lambda: defaultdict(recursivedict)

# constants
sensorName = "Simulator"
sensorType = "Honeypot"
url = "https://localhost:9999"
cert = ("ssl/simulator/simulator_cert.pem", "ssl/simulator/simulator_key.pem")

incidentTypes = {
	0: "Unknown",
	10: "Transport Layer",
	11: "Portscan",
	20: "Shellcode Injection",
	30: "SQL",
	31: "MySQL",
	32: "MS SQL",
	40: "SMB",
	50: "VoIP",
}

# Return a field only containing the mandatory field
def getMandatoryOnlyEntry():
	print("Only mandatory fields")
	payload = recursivedict()
	payload["src"]["ip"] = getRandomIP()
	return payload

# Return a randomly generated entry using every fields possible
def getFullEntry():
	print("Full entry")
	return {
		"sensor": {
			"name": sensorName,
			"type": sensorType,
		},
		"src": {
			"ip": getRandomIP(),
			"port": getRandomPort(),
		},
		"dst": {
			"ip": getRandomIP(),
			"port": getRandomPort(),
		},
		"type": getRandomIncident(),
		"log": getRandomLog(),
		"md5sum": getRandomMd5sum(),
		"date": getRandomTime(),
	}

# Return a randomly generated entry (mandatory field always set)
def getRandomizedEntry():
	print("Randomized entry")
	payload = recursivedict()
	setRandomly(payload, "sensor", "name", sensorName)
	setRandomly(payload, "sensor", "type", sensorType)
	payload["src"]["ip"] = getRandomIP()
	setRandomly(payload, "src", "port", getRandomPort())
	setRandomly(payload, "dst", "ip", getRandomIP())
	setRandomly(payload, "dst", "port", getRandomPort())
	setRandomly(payload, "type", None, getRandomIncident())
	setRandomly(payload, "log", None, getRandomLog())
	setRandomly(payload, "md5sum", None, getRandomMd5sum())
	setRandomly(payload, "date", None, getRandomTime())
	return payload

# Return a randomly set entry to be submitted
def getRandomlyEntry(mode):
	if mode == None:
		mode = random.randint(0, 2)
	# only set mandatory fields (source IP address)
	if mode == 0:
		payload = getMandatoryOnlyEntry()
	# set every possible field
	elif mode == 1:
		payload = getFullEntry()
	# set randomly fields (but always the mandatory field)
	else:
		payload = getRandomizedEntry()
	return json.dumps(payload)

# Return 32bit unix time
def getRandomTime():
	time = random.randint(0, 2**31 - 1)
	print("Date:", datetime.datetime.utcfromtimestamp(time), "(" + str(time) + ")")
	return time

# Set a value with a probability of 0.5
def setRandomly(target, key1, key2, content):
	if random.randint(0, 1) == 0:
		if key2 == None:
			target[key1] = content
		else:
			target[key1][key2] = content

# Return a random port ranging from 0 to 65535
def getRandomPort():
	return random.randint(0, 2**16 - 1)

# Return a random IP address
def getRandomIP():
	ip = [random.randint(0, 255) for _ in range(4)]
	return '.'.join([str(e) for e in ip])

# Return a random incident chosen from incidentTypes dictionary
def getRandomIncident():
	incident = random.choice(list(incidentTypes.keys()))
	print("Incident type:", incidentTypes[incident])
	return incident

# Return a random md5sum
def getRandomMd5sum():
	return str(hex(random.randint(0, 2**128 - 1)).lstrip("0x"))

# Return a random log message
def getRandomLog():
	return "Testlog with random value: " + str(random.randint(0, 2**10)) + "\nand a new line and <b>html</b>"

# Post the payload in json format to the server
def post(payload_json, url, cert, useCert, verify):
	try:
		if useCert:
			r = requests.post(url, cert=cert, verify=verify, data=payload_json)
		else:
			r = requests.post(url, verify=verify, data=payload_json)
		return payload_json + "\n --> " + str(r) + "\n>---\n" + r.text + "\n>---\n"
	except requests.exceptions.SSLError as e:
		print(e)
	except IOError as e:
		print("Either the cert, the key or both of them are not found.")
	except:
		 print("Unexpected error:", sys.exc_info()[0])
		 raise
	return ""
	#TODO cert,key not found exception
	

def main():
	parser = argparse.ArgumentParser(description = "Simulate...")#TODO
	parser.add_argument("-s", "--seed", help = "Seed...", type = int)#TODO
	parser.add_argument("-u", "--url", help = "Sever URL", default = url)
	parser.add_argument("-c", "--cert", help = "Simulator certificate path", nargs = 2, default = cert)
	parser.add_argument("-n", "--no-cert", help = "Disable certificate usage", action = "store_true")
	parser.add_argument("-v", "--verify-cert", help = "Disable server certificate verification", action = "store_true")
	parser.add_argument("-m", "--mode", help="Set the mode of entries (full, only mandatory, random)", choices = [0, 1, 2], type = int)
	args = parser.parse_args()
	
	# init seed
	if args.seed:
		seed = args.seed
	else:
		seed = random.randint(0, sys.maxsize)
	random.seed(seed)
	
	# get random entry
	entry = getRandomlyEntry(args.mode)
	print()
	
	# post the entry to the sever
	print(post(entry, args.url, args.cert, not args.no_cert, args.verify_cert))
	
	# determine new args applying the seed and every used argument
	newArgs = " ".join(sys.argv[1:])
	if not args.seed:
		newArgs += "--seed " + str(seed)
	print("To reproduce this simulation use the following argument(s): ")
	print("\t" + newArgs)
	print("For example using the following command: ")
	print("\t python " + sys.argv[0], newArgs)

if __name__ == '__main__':
	main()
