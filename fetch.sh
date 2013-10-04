#/**
# * TraCINg-Server - Gathering and visualizing cyber incidents on the world
# *
# * Copyright 2013 Matthias Gazzari, Annemarie Mattmann, André Wolski
# * 
# * Licensed under the Apache License, Version 2.0 (the "License");
# * you may not use this file except in compliance with the License.
# * You may obtain a copy of the License at
# * 
# *     http://www.apache.org/licenses/LICENSE-2.0
# * 
# * Unless required by applicable law or agreed to in writing, software
# * distributed under the License is distributed on an "AS IS" BASIS,
# * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# * See the License for the specific language governing permissions and
# * limitations under the License.
# */
#!/bin/bash

read -p "Would you like to install highcharts (only non-commercial use allowed without a license) [y/N]?:" answer

# define tmp zip file
tmp=tmp.zip

# define library path
lib=./frontend/extern

# jquery libraries
dest=$lib/jquery
mkdir -p $dest
wget http://code.jquery.com/jquery-2.0.3.min.js -O $dest/jquery.min.js
wget -NP $dest http://code.jquery.com/ui/1.10.3/jquery-ui.js
wget -NP $dest http://code.jquery.com/ui/1.10.3/themes/smoothness/jquery-ui.css
dest=$lib/jquery/images
mkdir -p $dest
wget http://jqueryui.com/resources/download/jquery-ui-1.10.3.zip -O $tmp && unzip -jod $dest $tmp *icons*.png *bg*.png && rm $tmp
dest=$lib/jquery
wget -NP $dest https://raw.github.com/ehynds/jquery-ui-multiselect-widget/1.13/src/jquery.multiselect.min.js
wget -NP $dest https://raw.github.com/ehynds/jquery-ui-multiselect-widget/1.13/jquery.multiselect.css
# plugin for datatables use
wget -NP $dest https://raw.github.com/cowboy/jquery-throttle-debounce/v1.1/jquery.ba-throttle-debounce.min.js

# bootstrap 2.3.2 library
dest=$lib/bootstrap
mkdir -p $dest
wget http://getbootstrap.com/2.3.2/assets/bootstrap.zip -O $tmp && unzip -jod $dest $tmp *.min.*
dest=$lib/bootstrap/images
mkdir -p $dest
unzip -jod $dest $tmp *.png* && rm $tmp

# highcharts library
if [ $answer == "yes" ] || [ $answer == "y" ]; then
	dest=$lib/highcharts
	mkdir -p $dest
	wget -NP $dest http://code.highcharts.com/highcharts.js
fi

# jvectormap library with world-miller-en
dest=$lib/jvectormap
mkdir -p $dest
wget -NP $dest http://jvectormap.com/js/jquery-jvectormap-world-mill-en.js
wget http://jvectormap.com/binary/jquery-jvectormap-1.2.2.zip -O $tmp && unzip -jod $dest $tmp *1.2.2* && rm $tmp
mv $dest/jquery-jvectormap-*.min.js $dest/jquery-jvectormap.min.js
mv $dest/jquery-jvectormap-*.css $dest/jquery-jvectormap.css

# leaflet library
dest=$lib/leaflet
mkdir -p $dest
wget http://leaflet-cdn.s3.amazonaws.com/build/leaflet-0.6.4.zip -O $tmp && unzip -od $dest $tmp leaflet.js leaflet.css images/* && rm $tmp

# globe.js library along with three.js library
dest=$lib/globe
mkdir -p $dest
wget -NP $dest http://threejs.org/build/three.min.js
wget -NP $dest https://raw.github.com/Cyber-Incident-Monitor/globe.js/master/globe.min.js
wget -NP $dest https://raw.github.com/Cyber-Incident-Monitor/globe.js/master/globe.css
dest=$lib/globe/images
mkdir -p $dest
wget -NP $dest https://raw.github.com/Cyber-Incident-Monitor/globe.js/master/textures/animation.png
wget -NP $dest https://raw.github.com/Cyber-Incident-Monitor/globe.js/master/textures/borders_oceans_lakes.png
wget -NP $dest https://raw.github.com/Cyber-Incident-Monitor/globe.js/master/textures/circle.png
wget -NP $dest https://raw.github.com/Cyber-Incident-Monitor/globe.js/master/textures/countries_colored.png
wget -NP $dest https://raw.github.com/Cyber-Incident-Monitor/globe.js/master/textures/gradient.png
wget -NP $dest https://raw.github.com/Cyber-Incident-Monitor/globe.js/master/textures/heat.png

# MaxMind GeoLiteCity.dat
wget http://geolite.maxmind.com/download/geoip/database/GeoLiteCity.dat.gz && gunzip -f GeoLiteCity.dat.gz

# datatables library
dest=$lib/datatables
mkdir -p $dest
wget https://datatables.net/releases/DataTables-1.9.4.zip -O $tmp && unzip -jod $dest $tmp *dataTables.css *dataTables.min.js
dest=$lib/datatables/images
mkdir -p $dest
unzip -jod $dest $tmp *.png && rm $tmp
# additions for combination with bootstrap
dest=$lib/datatables
wget -NP $dest http://datatables.net/media/blog/bootstrap_2/DT_bootstrap.js
wget -NP $dest http://datatables.net/media/blog/bootstrap_2/DT_bootstrap.css
