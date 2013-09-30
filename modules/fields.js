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

// default is for all fields: 0
var fields = {
    "type": {
        0: "Unknown",
        10: "Transport Layer",
        11: "Portscan",
        20: "Shellcode Injection",
        30: "SQL",
        31: "MySQL",
        32: "MS SQL",
        40: "SMB",
        50: "VoIP"
    },
    "type_description": {
        0: "The sensor could not determine the attack type",
        10: "The attacker connected to an open port, but did not interact with it",
        11: "The attacker tried to connect to a closed port",
        20: "The attacker successfully used an emulated security issue and would have been able to execute malicious code",
        30: "Attack on a database server",
        31: "Attack on a MySQL database server",
        32: "Attack on a Microsoft database server",
        40: "Attack on a SMB file server",
        50: "Attack on a Voice over IP device"
    }
};

exports.fields = fields;

exports.translate = function (serieField, currentSerie){
    if(fields[serieField.name].hasOwnProperty(currentSerie))
        return fields[serieField.name][currentSerie];
    else
        return fields[serieField.name][0];
};
