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
wget -NP $dest https://raw.github.com/ehynds/jquery-ui-multiselect-widget/1.13/src/jquery.multiselect.min.js
wget -NP $dest https://raw.github.com/ehynds/jquery-ui-multiselect-widget/1.13/jquery.multiselect.css

# bootstrap 2.3.2 library
dest=$lib/bootstrap
mkdir -p $dest
wget http://getbootstrap.com/2.3.2/assets/bootstrap.zip -O $tmp && unzip -jod $dest $tmp  *.min.* *.png* && rm $tmp

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
wget -NP $dest https://raw.github.com/Cyber-Incident-Monitor/globe.js/master/textures/animation.png
wget -NP $dest https://raw.github.com/Cyber-Incident-Monitor/globe.js/master/textures/borders_oceans_lakes.png
wget -NP $dest https://raw.github.com/Cyber-Incident-Monitor/globe.js/master/textures/circle.png
wget -NP $dest https://raw.github.com/Cyber-Incident-Monitor/globe.js/master/textures/countries_colored.png
wget -NP $dest https://raw.github.com/Cyber-Incident-Monitor/globe.js/master/textures/gradient.png
wget -NP $dest https://raw.github.com/Cyber-Incident-Monitor/globe.js/master/textures/heat.png

# MaxMind GeoLiteCity.dat
wget http://geolite.maxmind.com/download/geoip/database/GeoLiteCity.dat.gz && gunzip -f GeoLiteCity.dat.gz
