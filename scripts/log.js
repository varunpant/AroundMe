(function() {
	"use strict";

	App.Log = function() {
		if (!App.DEBUG) {
			return;
		}
		
		var args = Array.prototype.slice.call(arguments);

		var timestamp = "[" + new Date().toString("HH:mm:ss.SSS") + "]";
		args.unshift(timestamp);

		if (console) {
			console.log.apply(console, args);
		}
	};
}());