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

var orm = require("orm");
var db_driver;

/* start add custom filter */
var Filter = require('validator').Filter;
Filter.prototype.nl2br = function() {
	this.modify(this.str.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2'));
	return this;
}
/* end add custom filter */

var sanitize = require('validator').sanitize;

var Models = require("./models.js");

var config = require("../../config.json");
var fields = require("../fields.js");

var ready = false;
var Incident;

orm.connect(config.db, function (err, db) {
	if(err){
		console.log(err);
		return;
	}

	db_driver = db.driver;
	
	Models.initialize(db);
	Incident = Models.Incident;
	
	// synchronize orm-layer -> create or update tables for our models in the database
	db.sync(function (err) {
		if(err){
			console.log(err);
			return;
		}
		
		ready = true;
	});
});

function convertToDBModel(items){
	var arr = [];
	
	for(var i = 0; i < items.length; i++){
		var data = items[i];
	
		var obj = {
			date: data.date,
			
			sensortype: sanitize(data.sensortype).chain().trim().entityEncode().value(),
			sensorname: sanitize(data.sensorname).chain().trim().entityEncode().value(),
			
			source_port: data.src.port,
			source_ip: data.src.ip,
			
			destination_port: data.dst.port,
			destination_ip: data.dst.ip,
			
			type: data.type,
			log: sanitize(data.log).chain().trim().entityEncode().nl2br().value(),
			md5sum: sanitize(data.md5sum).chain().trim().entityEncode().value(),
			authorized: data.authorized,
		};
		
		if(data.src.country){
			obj["source_country"] = data.src.country;
			obj["source_cc"] = data.src.cc;
			obj["source_city"] = data.src.city;
			obj["source_latitude"] = data.src.ll[0];
			obj["source_longitude"] = data.src.ll[1];
		}
		
		if(data.dst.country){
			obj["destination_country"] = data.dst.country;
			obj["destination_cc"] = data.dst.cc;
			obj["destination_city"] = data.dst.city;
			obj["destination_latitude"] = data.dst.ll[0];
			obj["destination_longitude"] = data.dst.ll[1];
		};
		
		arr.push(obj);
	}

	return arr;
}

function convertFromDBModel(input){
	var arr = [];
	
	for(key in input){
		var data = input[key];
		
		arr[key] = {
			id: data.id,

			date: data.date, // is converted with new Date(date) when called in frontend
			
			sensortype: data.sensortype,
			sensorname: data.sensorname,
			
			src: {
				//ip: data.source_ip, // do not send ip to clients
				port: data.source_port,
				country: data.source_country,
				cc: data.source_cc,
				city: data.source_city,
				ll: [data.source_latitude, data.source_longitude],
			},
			
			dst: {
				//ip: data.destination_ip, // do not send ip to client
				port: data.destination_port,
				country: data.destination_country,
				cc: data.destination_cc,
				city: data.destination_city,
				ll: [data.destination_latitude, data.destination_longitude],
			},
			
			type: data.type,
			hasLog: (data.log && data.log != ''),
			md5sum: data.md5sum,
			authorized: data.authorized || false,
		};
	}
	
	return arr;
}

exports.getSensorTypes = function(callback){
	if(!ready){
		console.log("db is not ready!");
		// TODO: callback is undefined
		callback({errno: 0, code: "The database is not ready"});
		return;
	}

	db_driver.execQuery("SELECT sensortype FROM incident GROUP BY sensortype", function (err, data) {
		if(err){
			callback(err);
			return;
		}

		var sensors = [];
		for(var i = 0; i < data.length; i++){
			sensors.push(data[i]["sensortype"]);
		}

		callback(null, sensors);
	});
};

/*
getConditions translates the given filter to database conditions.

If the client could pass the filter directly to the database it would be possible for him to filter everything from the database, even fields he should not know of.
Also we can create more complex filters, eg. use orm.between

accepted filters:
- start: unix timestamp
- end: unix timestamp
- countries: array of country codes
*/
function getConditions(filter){
	var conditions = {};
	
	if(filter.hasOwnProperty("start") && filter.hasOwnProperty("end")){
		conditions["date"] = orm.between(new Date(filter["start"]), new Date(filter["end"]));
	}
	else if(filter.hasOwnProperty("start")){
		conditions["date"] = orm.gt(new Date(filter["start"]));
	}
	else if(filter.hasOwnProperty("end")){
		conditions["date"] = orm.lt(new Date(filter["end"]));
	}
	
	if(filter.hasOwnProperty("countries")){
		conditions["source_cc"] = filter["countries"];
	}

	if(filter.hasOwnProperty("authorized")){
		conditions["authorized"] = true;
	}

	if(filter.hasOwnProperty("types")){
		var types = [];
		for(var i = 0; i < filter["types"].length; i++) {
			types.push(parseInt(filter["types"][i], 10));
		}
		
		if(types.indexOf(0) != -1){
			var not_in = [];
			for(var i = 0; i < fields.validTypes.length; i++) {
				var validType = fields.validTypes[i];
				if(filter["types"].indexOf(validType) == -1)
					not_in.push(validType);
			}

			conditions["type"] = orm.not_in(not_in);
		}
		else{
			conditions["type"] = types;
		}
	}
	
	if(filter.hasOwnProperty("sensors")){
		conditions["sensortype"] = filter["sensors"];
	}
	
	return conditions;
}

function select(callback, filter, only, order){
	if(!ready){
		console.log("db is not ready!");
		callback({errno: 0, code: "The database is not ready"});
		return;
	}
	
	var conditions = filter && getConditions(filter) || {};
	only = only || [];
	
	var chain = Incident.find(conditions).only(only);
	
	if(order)
		chain = chain.order(order);

	chain.run(function(err, data){
		if(err){
			console.log(err);
			callback(err);
			return;
		}
		
		var converted = convertFromDBModel(data);
		callback(err, converted);
	});
};

/*
aggregateOptions:
 - fields: fields to select (array)
 - order (optional): array
 - conditions (optional): object
 - strftime (optional): object: {format, field, alias}
 - group_by (optional): array
*/
function selectAggregate(callback, aggregateOptions){
	if(!ready){
		console.log("db is not ready!");
		callback({errno: 0, code: "The database is not ready"});
		return;
	}
	
	var conditions = aggregateOptions.conditions || {};
	
	var query = Incident.aggregate(aggregateOptions.fields, conditions);
	
	if(aggregateOptions.strftime){
		var time = aggregateOptions.strftime;
		query = query.call("strftime", [orm.Text(time.format), time.field]).as(time.alias);
	}

	if(aggregateOptions.group_by)
		query.groupBy.apply(query, aggregateOptions.group_by);
	
	if(aggregateOptions.order)
		query.order.apply(query, aggregateOptions.order);
	
	query.count();
	
	query.get(callback);
}

exports.insert = function(items, callback){
	if(!ready){
		console.log("db is not ready!");
		if(callback)
			callback({errno: 0, code: "The database is not ready"});
		return;
	}
	

	var arr = convertToDBModel(items);
	
	Incident.create(arr, function(err, newItems){
		if(callback){
			var converted = null;
			if(newItems){
				converted = convertFromDBModel(newItems);
			}
			
			callback(err, converted);
		}
		else{
			if(err)
				console.log(err);
			else
				console.log("db.insert: no callback given, but also no err, so everything is fine");
		}
	});
};

exports.requestAttacks = function(filter, callback){
	select(callback, filter, null, "date");
};

exports.getLog = function(id, callback){
	if(!ready){
		console.log("db is not ready!");
		callback({errno: 0, code: "The database is not ready"});
		return;
	}
	
	// TODO: remove {cache: false} when https://github.com/dresende/node-orm2/issues/350 is resolved and released with a new version of orm
	Incident.find({id: id} , {cache: false}).only(["log"]).run(function(err, data){
		if(err){
			console.log(err);
			callback(err, null);
			return;
		}
		
		if(data && data.length>0){
			var log = data[0].log;
			callback(null, log);
		}
		else{
			callback(null, null);
		}
	});
};

/*
serieFieldHelper fills aggregateOptions depending on options.detailChartType and returns serieField
*/
function serieFieldHelper(callback, options, aggregateOptions){
		var serieField = {};

		if(options.detailChartType == "typeDate"){
			serieField.name = "type";
		}
		else if(options.detailChartType == "countryDate"){
			serieField.name = "source_cc";
			serieField.displayName = "source_country";
		}
		else{
			callback("getStatistics: unknown detailChartType: " + detailChartType);
			return;
		}

		// select that field
		aggregateOptions.fields.push(serieField.name);
		
		// select also the displayName if given
		if(serieField.displayName){
			aggregateOptions.fields.push(serieField.displayName);
		}
		
		// group and order by it (unshift: put it at the beginning of the array)
		aggregateOptions.group_by.unshift(serieField.name);
		aggregateOptions.order.unshift(serieField.name);

		return serieField;
}

/*
extractSeries converts plain rows to an array of series

If no serieField given it just creates one serie with the name "total".

It also translates the content of serieField to a human readable value (e.g. "DE" -> "Germany" for source_cc, 31 -> "MySQL" for "type")
* if serieField.displayName is set it takes that column, otherwise it uses fields.translate

The rows need to be sorted by serieField to detect change of that field // TODO: may implement it in a way that this is not required?

example input with serieField.name="source_cc" and serieField.displayName="source_country":
[
	{source_cc: "DE", source_country: "Germany", field1: "foo1", field2: "asdf"}, // = row0
	{source_cc: "DE", source_country: "Germany", field1: "foo2"}, // = row1
	{source_cc: "US", source_country: "United States", field1: "bar1"}, // = row2
	{source_cc: "US", source_country: "United States", field1: "bar2"}, // = row3
]

example output:
[
	{name: "Germany", data: [row0, row1]},
	{name: "United States", data: [row2, row3]}
]

*/
function extractSeries(rows, serieField){
		var series = [];
		
		// create for each different `serieField` a new serie
		if(serieField){
			var currentSerieValue = null;
			var serie = null;
			
			for(var k in rows){
				var row = rows[k];
				var rowSerieValue = row[serieField.name];
				
				// check if `serieField` changed in this row from previous row (or if it is the first row)
				if(currentSerieValue != rowSerieValue){
					// if we filled a serie it is done now, push it to finished series
					if(serie)
						series.push(serie);

					currentSerieValue = rowSerieValue;
					
					// create a new serie
					serie = { data: [] };

					// set the name of the serie that should be displayed
					if(serieField.displayName)
						serie.name = row[serieField.displayName];
					else
						serie.name = fields.translate(serieField, currentSerieValue);
				}

				// push this row to the current serie
				serie.data.push(row);
			}

			// push last serie
			if(serie)
				series.push(serie);
		}
		else{
			// just one serie
			series.push({
				name: "total",
				data: rows,
			});
		}

		return series;
}

/*
converts the dates to unix time in all data of all series

determines minDate and maxDate if not given

fills all series with 0-data on each date between minDate and maxDate if it has no data on that day
*/
function convertDates(series, minTimestamp, maxTimestamp){
		var checkMinMax = !minTimestamp || !maxTimestamp; // no logical need for this check, but should give performance as in most cases min and max are given
		
		// convert the dates to UTS timestamps for each serie
		for(var i = 0; i < series.length; i++){
			// convert it for each data entry
			for (var j = 0; j < series[i].data.length; j++) {
				var date = new Date(series[i].data[j].date);
				var year = date.getUTCFullYear();
				var month = date.getUTCMonth();
				var day = date.getUTCDate();
				
				var timestamp = Date.UTC(year, month, day);
				
				series[i].data[j] = [timestamp, series[i].data[j].count];
				
				if(checkMinMax){
					if(!minTimestamp || minTimestamp > timestamp)
						minTimestamp = timestamp;
					if(!maxTimestamp || maxTimestamp < timestamp)
						maxTimestamp = timestamp;
				}
			}
		}

		for(var j = 0; j < series.length; j++){
			var currentTimestamp = minTimestamp;
			var i = 0;
			var maxI = series[j].data.length;
			var newData = [];
			while(currentTimestamp <= maxTimestamp){
				//console.log("convertDates.currentTimestamp:", currentTimestamp, new Date(currentTimestamp));
				
				if(i >= maxI || currentTimestamp < series[j].data[i][0]){
					newData.push([currentTimestamp, 0]);
				}
				else{
					newData.push([currentTimestamp, series[j].data[i][1]]);
					i++;
				}
				
				// next day
				currentTimestamp += 24 * 60 * 60 * 1000;
			}
	
			series[j].data = newData;
		}
}

exports.getStatistics = function(options, callback){
	console.log("db.js: getStatistics called");
	console.log("options: " + options);
	
	var aggregateOptions = {
		fields: ["date"], // selecting also date makes it currently easier to convert the selected date
		strftime: {format: "%Y-%m-%d", field: "date", alias: "dt"},
		group_by: ["dt"],
		order: ["date"], // it does not matter if we order by date or dt
		conditions: {},
	};

	
	var serieField = null;
	
	if(options.detail)
		serieField = serieFieldHelper(callback, options, aggregateOptions); // sets also aggregateOptions
	
	if(options.filter){
		aggregateOptions.conditions = getConditions(options.filter);
	}
	
	var innerCallback = function(err, rows){
		if(err){
			callback(err);
		}
		
		if(!rows || rows.length == 0){
			callback(null, []);
			return;
		}
		
		var series = extractSeries(rows, serieField);
		
		//for(var i = 0; i < series.length; i++)
			//console.log("raw series["+i+"]", series[i]);
		
		if(options.filter)
			convertDates(series, options.filter.start, options.filter.end);
		else
			convertDates(series);
		
		//for(var i = 0; i < series.length; i++)
			//console.log("series["+i+"]", series[i]);
		
		callback(null, series);
	};
	
	selectAggregate(innerCallback, aggregateOptions);
};
