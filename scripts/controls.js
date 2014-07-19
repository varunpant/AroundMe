(function() {
	"use strict";

	var initSelect = function()
	{
		App.getDistinctPlaces(callback);
		var select = App.$("ddlPlaces");
		App.addevent(select,"change",function(){
			var index = this.selectedIndex;
			var value = this.options[index].value;
			App.Log(value);
			App.paginator.reset();
			if(value!=="any"){
				App.fetchData("?q=type:"+value);
			}
			else{
				App.fetchData();
			}
		})
	}

	var callback =function(resp)
	{
		var data =JSON.parse(resp.responseText);
		var terms =data.facets.tag.terms;
		App.Log(terms);
		var options = [];
		options.push("<option value='any'>---ANY---</option>");
		for(var i=0;i<terms.length;i++)
		{
			var term =terms[i].term ;
			options.push("<option value='"+term+"'>" + term.replace(/_/g," ") + "</option>");
		}
		App.$("ddlPlaces").innerHTML = options.join("");
	}

	var searchBox = new google.maps.places.SearchBox((App.$("txtSearch")));
	google.maps.event.addListener(searchBox, 'places_changed', function () {
		var places = searchBox.getPlaces();
  	//  console.log(places);
	  var place = places[0]
	  var location = place.geometry.location;
	  var _Lat = location.lat();
	  var _Lon = location.lng();
	  App.centerMaptorequestedCenter(_Lat, _Lon);
	});



	App.initSelect = initSelect;

}());