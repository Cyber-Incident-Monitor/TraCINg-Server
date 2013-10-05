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

# constants and defaults
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
	60: "Invalid"		# invalid test case
}
predefined = {
	"sensor": {
		"name": "Predefined Sensor Name",
		"type": "Predefined Sensor Type",
	},
	"src": {
		"ip": "130.83.58.211",
		"port": 80,
	},
	"dst": {
		"ip": "192.30.252.130",
		"port": 22,
	},
	"type": 0,
	"log": "Predefined Log",
	"md5sum": "7867de13bf22a7f3e3559044053e33e7",
	"date": 1,
}

# Return a field only containing the mandatory field
def getMandatoryOnlyEntry():
	payload = recursivedict()
	payload["src"]["ip"] = getRandomIP()
	return payload

# Return a randomly generated entry using every fields possible
def getFullEntry(chooseRandomly):
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
		"date": getTime(chooseRandomly),
	}

# Return a randomly generated entry (mandatory field always set)
def getRandomizedEntry(chooseRandomly):
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
	setRandomly(payload, "date", None, getTime(chooseRandomly))
	return payload

# Return a randomly set entry to be submitted
def getRandomlyEntry(mode, chooseRandomly):
	if mode == None:
		mode = random.randint(0, 2)
	# only set mandatory fields (source IP address)
	if mode == 0:
		payload = getMandatoryOnlyEntry()
	# set every possible field
	elif mode == 1:
		payload = getFullEntry(chooseRandomly)
	# set randomly fields (but always the mandatory field)
	else:
		payload = getRandomizedEntry(chooseRandomly)
	return payload

# Return either the current or a random time (32bit unix time)
def getTime(chooseRandomly):
	if chooseRandomly:
		return random.randint(0, 2**31 - 1)
	else:
		return int(time.time())

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
	return random.choice(list(incidentTypes.keys()))

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
	
# define a positive integer type
def positiveInt(string):
	value = int(string)
	if value < 0:
		msg = string + " is not a positive integer"
		raise argparse.ArgumentTypeError(msg)
	return value

def main():
	# define arguments and their behaviour
	parser = argparse.ArgumentParser(description = "Simulate incident reports (single, multiple or in logs) and send them via HTTPS POST to a designated server.")
	parser.add_argument("-s", "--seed", help = "set the SEED to initialize the pseudorandom number generator", type = positiveInt)
	parser.add_argument("-m", "--mode", help = "determine which fields are sent (0: only mandatory fields, 1: every possible field, 2: at least the mandatory fields)", choices = [0, 1, 2], type = int)
	parser.add_argument("-n", "--number", help = "set the NUMBER of incident reports (or logs) to be sent (by default 1)", type = positiveInt, default = 1)
	parser.add_argument("-i", "--interval", help = "set the MIN and MAX time in ms between single incident reports (by default 1000 and 1000)", nargs = 2, metavar = ("MIN", "MAX"), type = positiveInt, default = [1000, 1000])
	parser.add_argument("-v", "--verbose", help = "show more details while sending incident reports", action = "store_true")
	parser.add_argument("-u", "--url", help = "set the server URL to sent the incident report(s) (by default " + url + ")", default = url)
	certFormated = str(cert).replace("(", "").replace(",", " and")
	parser.add_argument("-c", "--cert", help = "set the CERT and private KEY path to be used (by default " + certFormated, nargs = 2, metavar = ("CERT", "KEY"), default = cert)
	parser.add_argument("-nc", "--no-cert", help = "disable certificate usage", action = "store_true")
	parser.add_argument("-vc", "--verify-cert", help = "disable server certificate verification", action = "store_true")
	parser.add_argument("-lf", "--log-format", help = "send multiple incident reports in one log (by default 3 to 10 reports per log)", action = "store_true")
	parser.add_argument("-ls", "--log-size", help = "set the MIN and MAX number of incident reports per log (by default MIN = 3 and MAX = 10)", nargs = 2, metavar = ("MIN", "MAX"), type = positiveInt, default = [3, 10])
	parser.add_argument("-r", "--random-time", help = "set the timestamp at random instead of using the current time", action = "store_true")
	group = parser.add_mutually_exclusive_group()
	group.add_argument("-p", "--predefined", help = "send a predefined incident report (cf. the source of this program for details about the predefined report)", action = "store_true")
	group.add_argument("-cu", "--custom", help = "apply a custom incident REPORT in JSON format, for example: '{\"src\":{\"ip\":\"192.30.252.130\"}}' (put the incident report into single quotes to prevent the shell from removing the double quotes)", metavar = "REPORT", type = json.loads)
	args = parser.parse_args()
	
	# init seed
	if args.seed:
		seed = args.seed
	else:
		seed = random.randint(0, sys.maxsize)
	random.seed(seed)
	
	# send incidents
	if args.number > 0:
		for i in range(0, args.number):
			# send multiple entries in one log separated by \n
			if args.custom is not None:
				entry = args.custom
			elif args.predefined:
				entry = predefined
			elif args.log_format:
				entry = ""
				size = random.randint(args.log_size[0], args.log_size[1])
				for j in range(0, size):
					entry += getRandomlyEntry(args.mode, args.random_time) + "\n"
			else:
				# send a single entry
				entry = getRandomlyEntry(args.mode, args.random_time)
			# post the entry
			result = post(json.dumps(entry), args.url, args.cert, not args.no_cert, args.verify_cert)
			# print server reply
			if args.verbose:
				print("-----------------------------------------------")
				print("Attack No.:", i + 1, "of", args.number)
				try:
					print("Date (UTC):", datetime.datetime.utcfromtimestamp(entry["date"]))
				except:
					print("Date is not supplied")
				try:
					print("Incident type:", incidentTypes[entry["type"]])
				except:
					print("Incident type is not supplied")
				print("Server response:\n")
				print(result)
			else:
				print("Attack No.:", i + 1, "of", args.number)
			# avoid sleep in the last loop
			if i < args.number - 1:
				time.sleep(random.randint(args.interval[0], args.interval[1])/1000)
	
	if args.verbose:
		print("-----------------------------------------------")
	
	# determine new args applying the seed if missing to the previous args
	newArgs = " ".join(sys.argv[1:])
	if not args.seed:
		newArgs += " --seed " + str(seed)
	
	# add single quotes to custom json entry argument
	# (prevent the shell removing the required double quotes)
	if args.custom is not None:
		trimmedEntry = str(entry).replace(" ", "").replace("'", '"')
		newArgs = newArgs.replace(trimmedEntry, "'" + trimmedEntry + "'")
	
	# print used arguments with an additional example command
	print("To reproduce this simulation use the following argument(s): ")
	print("\t" + newArgs)
	print("For example using the following command: ")
	print("\t python " + sys.argv[0], newArgs)

if __name__ == '__main__':
	main()
