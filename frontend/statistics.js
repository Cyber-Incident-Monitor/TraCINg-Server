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

var detailChartType = "typeDate";

/*
* queries data, filters it, updates the chart
* 
* options: object
*  - chart: reference to a highcharts Chart
*  - name: string, name of the data that should be displayed
*  - detail: boolean, whether to fetch detailed data or just data for the master chart (optional, default: false)
*/
function updateChart(options){
	var rawSeries;
	var title, subtitle, xTitle, yTitle;
	
	// get the chart and delete it from options
	var chart = options.chart;
	delete options.chart;
	
	options.filter = filter.getFilter();
	
	// fetch the series
	if(options.detail){
		options.detailChartType = detailChartType;
		
		// patch start and end into the filter
		options.filter["start"] = currentStartDate;
		options.filter["end"] = currentEndDate;
		
		
		if(detailChartType == "typeDate"){
			options.pie = true;
			
			title = {text: "Types of Incidents"};
			subtitle = {text: "per day"};
			yTitle = {text: "Incidents per day"};
		}
		else if(detailChartType == "countryDate"){
			options.pie = true;
			
			title = {text: "Source countries"};
			subtitle = {text: "per day"};
			yTitle = {text: "Incidents per day"};
		}
		else{
			console.log("error: unknown type: " + detailChartType);
			return;
		}
	}
	else{
		// nothing to do..
	}
	
	// some formatting of the chart
	if(title || subtitle)
		chart.setTitle(title, subtitle);
	if(xTitle)
		chart.xAxis[0].setTitle(xTitle);
	if(yTitle)
		chart.yAxis[0].setTitle(yTitle);
	
	chart.showLoading("loading..");
	
	socket.emit("getStatistics", options, function(data){
		console.log("getStatistics returned: ", data);
		
		if(!data || data.length == 0){
			chart.showLoading("No data for that selection!");
			return;
		}

		// filter the series
		var chartSeries = createChartSeries(data, options);
		
		// display the series
		setChartData(chart, chartSeries);
	});
}

/*
* setChartData
* removes all series from a chart and adds the new series
* 
* chart: reference to a highcharts Chart
* data: array of series to be added
*/
function setChartData(chart, data){
	var oldLenght = chart.series.length;

	// add new series
	for(var i = 0; i < data.length; i++){
		chart.addSeries(data[i], false); // false: do not redraw
	}
	
	chart.redraw();

	// remove old series
	for(var count = 0; count < oldLenght; count++){
		chart.series[0].remove(false); // do not redraw
	}
	

	chart.hideLoading();
	chart.redraw();

	$(".highcharts-legend-item > span").each(function(i, el){el.onclick = null;});
}

/*
* createChartSeries
* creates series for the chart from the given series, also calculates the pie serie (if options.pie is true)
* 
* arguments:
*  * series: array of all series that should be displayed
*  * options: optional object of options:
*    - pie: boolean if the last serie is a pie
*/
function createChartSeries(series, options){
	console.log("createChartSeries", series, options);
	
	// store here the data 
	var result = [];
	
	var pie;
	if(options.pie){
		pie = {
			type: "pie",
			name: "Total incidents",
			center: [160, 55],
			size: 100,
			showInLegend: false,
			data: [], // the data is calculated below
		};
	}
	
	// for each serie
	for(var i = 0; i < series.length; i++){
		var c = series[i];
		
		function getColor(i){
			//return Highcharts.getOptions().colors[i];
			
			if(i % 8 == 0)
				return "#0000FF"; // blue
			else if(i % 8 == 1)
				return "#FF0000"; // red
			else if(i % 8 == 2)
				return "#00FF00"; // green
			else if(i % 8 == 3)
				return "#FFFF00"; // yellow
			else if(i % 8 == 4)
				return "#FF00FF"; // magenta
			else if(i % 8 == 5)
				return "#00FFFF"; // cyan
			else if(i % 8 == 6)
				return "#FF7F00"; // orange
			else if(i % 8 == 7)
				return "#808080"; // grey
			/*else if(i % 9 == 8)
				return "#964B00"; // brown*/
			
		}

		// add the serie to the result
		result.push({name: c.name, data: c.data, color: getColor(i)});
		
		
		if(options.pie){
			var sum = 0;
			
			// for each entry of the serie
			for(var j = 0; j < c.data.length; j++){
				// sum the data of this serie for the pie
				sum += c.data[j][1];
			}
			
			// add the summed serie to the pie
			pie.data.push({name: c.name, y: sum, color: getColor(i)});
		}
	}
	
	if(options.pie){
		// add the pie to the result
		result.push(pie);
	}
	
	return result;
}


// initial timespan for the detailChart
var defaultEndDate = Date.now();
var defaultStartDate = defaultEndDate - (2 * 7 * 24 * 60 * 60 * 1000); // two weeks ago

var currentStartDate = defaultStartDate;
var currentEndDate = defaultEndDate;

var detailChart, masterChart;

// detailed statistics chart
function createDetailChart(masterChart) {
	detailChart = $('#chartdivdetail').highcharts({
		chart: {
			type: 'area'
		},
		xAxis: {
			type: 'datetime'
		},
		legend: {useHTML: true},
		plotOptions: {
			area: {
				stacking: 'normal',
				lineColor: '#666666',
				lineWidth: 1,
				marker: {
					lineWidth: 1,
					lineColor: '#666666'
				}
			}
		},
		tooltip: {
			//formatter: function() {
			//	return false;
			//}
		},
	}).highcharts();
	
	updateChart({
		chart: detailChart,
		detail: true,
	});
}

// timeline chart
function createMasterChart(){
	masterChart = $("#chartdivmaster").highcharts({
		title: {text: null},
		reflow: false,
		borderWidth: 0,
		chart: {
			type: 'area',
			events: {
				// listen to the selection event on the master chart to update the detail chart
				selection: function(event) {
					// get the selection
					var extremesObject = event.xAxis[0];
					var min = extremesObject.min;
					var max = extremesObject.max;
					
					currentStartDate = min;
					currentEndDate = max;
					
					// select and filter data for the detailChart and update it
					updateChart({
						chart: detailChart,
						detail: true,
					});
					
					// move the plot band to reflect the new detail span
					var xAxis = this.xAxis[0];
					xAxis.removePlotBand('mask');
					xAxis.addPlotBand({
						id: 'mask',
						from: min,
						to: max,
						color: 'rgba(255, 144, 0, 0.6)' // #FF9000; alpha = 60%
					});
					
					// TODO: for what is the return value?
					return false;
				}
			},
			zoomType: 'x',
		},
		xAxis: {
			type: 'datetime',
			plotBands: [{
				id: 'mask',
				from: defaultStartDate,
				to: defaultEndDate,
				color: 'rgba(255, 144, 0, 0.6)'
			}],
		},
		yAxis: {
			gridLineWidth: 0,
			title: {text: null},
			labels: {enabled: false},
		},
		legend: {enabled: false},
		credits: {enabled: false},
		tooltip: {
			formatter: function() {
				return false;
			}
		},
		plotOptions: {
			series: {
				fillColor: {
					linearGradient: [0, 0, 0, 70],
					stops: [
						[0, '#4572A7'],
						[1, 'rgba(0,0,0,0)']
					]
				},
				lineWidth: 1,
				marker: {
					enabled: false
				},
				shadow: false,
				states: {
					hover: {
						lineWidth: 1
					}
				},
				enableMouseTracking: false
			}
		},
	}, function(masterChart){
		createDetailChart(masterChart);
	}).highcharts();
	
	updateChart({
		chart: masterChart,
		detail: false,
	});
}

var createdCharts = false;
/*
 * create Chart container and objects if not done
 * returns if it created or not
 */
function createCharts(){
	if(!createdCharts){
		createdCharts = true;
		var container = $('#stats');
		container.append("<div id='chartdivdetail' class='chart'></div>");
		container.append("<div id='chartdivmaster' class='chart' style='height: 100px;' onHelpActive='help-border'></div><span class='help-block'>Click and drag the mouse across the above timeline to choose a timespan.</span>");
		createMasterChart();
		return true;
	}
	return false;
}

function loadStats(detailType, updateMaster){
	if(detailType)
		detailChartType = detailType;
	
	var created = createCharts();
	if(!created){ // createCharts loads the charts with the correct data; if there are already charts we need to update them
		updateChart({
			chart: detailChart,
			detail: true,
		});
		
		if(updateMaster){
			updateChart({
				chart: masterChart,
				detail: false,
			});
		}
	}
}

// called when the filter was updated
function filterUpdateStats(){
	loadStats(null, true);
}
