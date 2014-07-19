/* globals window, _ */
(function() {
	"use strict";

	var App = {
		VERSION: 1.0,
		DEBUG: true,
		$:function(id){return document.getElementById(id);},
		addevent:function(o, e, f){
			if (window.addEventListener) 
				o.addEventListener(e, f, false);
			else 
				if (window.attachEvent) 
					r = o.attachEvent('on' + e, f);
			}
		};


		window.App = App;

		App.addevent(window,"load", function(event) {
			App.init(event);
			App.initSelect();
			App.paginator.init(event);
		}, false );
	}());