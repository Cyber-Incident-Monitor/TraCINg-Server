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

var Controller = function() {
	
	// attributes and constants
	var modifier;
	var args;
	var zoom;
	var move;
	var toggle;
	var enabled;
	
	/**
	 * Init variables and set event listener
	 */
	function init(obj) {
		// init modifier map
		modifier = {};
		// init enabled
		enabled = true;
		// set possible arguments used by callbacks
		args = {
			IN: 0,
			OUT: 1,
			UP: 2,
			DOWN: 3,
			LEFT: 4,
			RIGHT: 5
		};
		// initalize keyboard events
		document.addEventListener('keydown', onDocumentKeyDown, false);
		document.addEventListener('keyup', onDocumentKeyUp, false);
		obj.args = args;
	}
	
	/**
	 * This function gets called if a key is released
	 */
	function onDocumentKeyUp(event) {
		var keyCode = event.keyCode;
		// check for modifier keys
		if(keyCode == 17)
			modifier["STRG"] = false;
		if(keyCode == 18)
			modifier["ALT"] = false;
		if(keyCode == 91)
			modifier["SUPER"] = false;
		if(keyCode == 225)
			modifier["ALT_GR"] = false;
	}
	
	/**
	 * This function gets called if a key is pressed.
	 */
	function onDocumentKeyDown(event) {
		var keyCode = event.keyCode;
		
		// check modifier keys
		if(keyCode == 17)
			modifier["STRG"] = true;
		if(keyCode == 18)
			modifier["ALT"] = true;
		if(keyCode == 91)
			modifier["SUPER"] = true;
		if(keyCode == 225)
			modifier["ALT_GR"] = true;
		
		// check if one ore more modifiers are enabled
		var modifierEnabled = false;
		for(var key in modifier) {
			modifierEnabled |= modifier[key];
		}
		
		// try to execute an action if no modifiers are enabled and
		// the control is enabled
		if(!modifierEnabled && enabled) {
			switch(keyCode) {
				case 38:
					// arrow up: zoom in
					if (zoom != undefined) {
						event.preventDefault();
						zoom(args.IN);
					}
					break;
				case 40:
					// arrow down: zoom out
					if (zoom != undefined) {
						event.preventDefault();
						zoom(args.OUT);
					}
					break;
				case 87:
					// w: rotate the globe up, move maps up
					if (move != undefined) {
						event.preventDefault();
						move(args.UP);
					}
					break;
				case 65:
					// a: rotate the globe to the left, move maps left
					if (move != undefined) {
						event.preventDefault();
						move(args.LEFT);
					}
					break;
				case 83:
					// s: rotate the globe down, move maps down
					if (move != undefined) {
						event.preventDefault();
						move(args.DOWN);
					}
					break;
				case 68:
					// d: rotate the globe to the right, move maps right
					if (move != undefined) {
						event.preventDefault();
						move(args.RIGHT);
					}
					break;
				case 84:
					// t: toggle heatmap/map view (globe)
					if (toggle != undefined) {
						event.preventDefault();
						toggle();
					}
					break;
			}
		}
	}
	
	/**
	 * Set the callbacks executed by their specific keyDown events
	 */
	this.registerCallbacks = function(callbacks) {
		zoom = callbacks.zoom;
		move = callbacks.move;
		toggle = callbacks.toggle;
	}
	
	/**
	 * Reset the callbacks executed by their specific keyDown events
	 */
	this.unregisterCallbacks = function() {
		zoom = undefined;
		move = undefined;
		toggle = undefined;
	}
	
	/**
	 * Toggle whether the key control is enabled or not
	 */
	this.toggleEnabled = function() {
		enabled = !enabled;
		return enabled;
	}
	
	// init control
	init(this);
}
