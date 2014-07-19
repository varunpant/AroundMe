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
(function() {
	"use strict";

	/* == Utility method to send AJAX request. == */
	function sendRequest(url, callback, postData){
		var req = createXMLHTTPObject();
		if (!req) 
			return;
		var method = (postData) ? "POST" : "GET";
		req.open(method, url, true);
		//req.setRequestHeader('User-Agent', 'XMLHTTP/1.0');
		if (postData) 
			req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		req.onreadystatechange = function(){
			if (req.readyState != 4) 
				return;
			if (req.status != 200 && req.status != 304) {
                //	alert('HTTP error ' + req.status);
                return;
            }
            callback(req);
        }
        if (req.readyState == 4) 
        	return;
        req.send(postData);
    }
    
    /* == Utility method to form XMLHttpFactories. == */
    function XMLHttpFactories(){
    	return [function(){
    		return new XMLHttpRequest()
    	}, function(){
    		return new ActiveXObject("Msxml2.XMLHTTP")
    	}, function(){
    		return new ActiveXObject("Msxml3.XMLHTTP")
    	}, function(){
    		return new ActiveXObject("Microsoft.XMLHTTP")
    	}
    	];
    }
    
    /* == Utility method to create XMLHttpFactories. == */
    function createXMLHTTPObject(){
    	var xmlhttp = false;
    	var factories = XMLHttpFactories();
    	for (var i = 0; i < factories.length; i++) {
    		try {
    			xmlhttp = factories[i]();
    		} 
    		catch (e) {
    			continue;
    		}
    		break;
    	}
    	return xmlhttp;
    }


    /* == Utility method to form query json to get distict types. == */
    var getDistinctTemplate = function()
    {
    	return JSON.stringify({
    		"query" : {
    			"match_all" : {  }
    		},
    		"facets" : {
    			"tag" : {
    				"terms" : {
    					"field" : "type",
    					"size" : 100
    				}
    			}
    		}
    	});
    }
    /* == Utility method to form search query json. == */
    var getQueryTemplate = function(lat,lon,dist){ 
    	App.Log(lat+" : " + lon);
    	var query = {
    		"sort" : [
    		{
    			"_geo_distance" : {
    				"location" : {
    					"lat" : lat,
    					"lon" : lon
    				}, 
    				"order" : "asc",
    				"unit" : "km"
    			}
    		}
    		],
    		"query":{
    			"filtered" : {
    				"query" : {
    					"match_all" : {}
    				},
    				"filter" : {
    					"geo_distance" : {
    						"distance" : dist+"km",
    						"location" : {
    							"lat" : lat,
    							"lon" : lon
    						}
    					}
    				}
    			}

    		}
    	}
    	/* == If filter is applied then modify query. == */
    	var places = App.$("ddlPlaces");
    	if(places.selectedIndex > -1)
    	{
    		var value = places.options[places.selectedIndex].value;
    		if(value !=="any")
    		{
    			query.query.filtered.query =
    			{
    				"bool": {
    					"should": [{
    						"term": {
    							"type": value
    						}
    					}]
    				}
    			}
    		}
    	}
    	return   JSON.stringify(query);

    };

    var $ = App.$;
    /* == Call back method to process search data. == */
    var callback = function(resp){

    	if (resp.responseText) {
    		var jsonData = JSON.parse(resp.responseText);

    		App.paginator.configure(jsonData.hits.total);

    		var jsonServiceResults = jsonData.hits.hits;
    		var markup = "<ol class='resultList'>";
    		for (var i = 0; i < jsonServiceResults.length; i++) {
    			var prop = jsonServiceResults[i];
    			var posi = prop._source.location;
    			markup += getMarkup(prop);
    			App.AddMarker(posi,prop._source.name,prop._id);
    		};
    		markup+="</ol>"
    		$("lhc").innerHTML = markup;
    	}
    }

    /* == Utility method to generate Li for search results. == */
    var getMarkup = function(hit)
    {
    	App.Log(hit);
    	return "<li id='" + hit._id +"' onclick='App.ShowPopup(this)'>" + hit._source.name + " - " + hit._source.type+"</li>";
    }
    /* == Gets the json search results via AJAX == */
    var fetchData = function(){ 
    	App.ClearMarker();
    	$("lhc").innerHTML="";
    	var searchRadious = App.getRadious();
    	var uri = App.paginator.getUri();
    	var posi = App.getSearchCenter();
    	var postData = getQueryTemplate(posi.lat, posi.lng, searchRadious) ;
    	
    	/* == Send Request == */
    	sendRequest(uri, callback ,postData);
    }
    /* == Gets the detail of search results(don't really need it but here only for demonstration.) == */
    var fetchDetails=function(id,showWindow,marker)
    {
    	var uri = "/elastic/places/place/"+id;
    	sendRequest(uri,function(resp){
    		var record = JSON.parse(resp.responseText);
    		
    		var html =[];
    		html.push('<table cellspacing=\'0\'><thead><th>Attribute</th><th>Value</th></thead>');
    		var s = record._source;
    		for(var o in s)
    		{
    			if(o == 'location'){
    				html.push('<tr><td>Latitude</td><td>' + s[o].lat + '</td></tr>');
    				html.push('<tr><td>Longitude</td><td>' + s[o].lon + '</td></tr>');
    			}
    			else{
    				html.push('<tr><td>' + o + '</td><td>' + s[o] + '</td></tr>');
    			}
    		}
    		html.push('</table>')
    		showWindow(marker,'<b>'+ html.join('') + '</b>');
    	});
    }
    /* == Gets distict types colum ordered by count(we pick only top 100) to populate filter dropdown== */
    var getDistinctPlaces =function(callback){
    	var uri = "/elastic/places/_search";
    	var postData = getDistinctTemplate();
    	sendRequest(uri,callback,postData);

    }

    /* == Expose methods to be called from other places. == */
    App.getDistinctPlaces = getDistinctPlaces;
    App.fetchData = fetchData;
    App.fetchDetails = fetchDetails;


}());
(function() {
	"use strict";
	var $ = App.$;
	var pageInfo = $('pageInfo');
	var fetchData = App.fetchData;

	var paginator = {
		totalPages: 0,
		currentPage: 0,
		pagesize: 100,
		totalResults: 0,
		uri:'http://localhost/elastic/places/_search?size={0}&from={1}',
		init: function(){

			App.addevent($("pagePrev"),"click",function(ev){
				ev.stopPropagation();
				if (paginator.currentPage > 1) {
					paginator.currentPage--;
					fetchData();
				}

				return false;
			})

			App.addevent($("pageNext"),"click",function(ev){
				ev.stopPropagation();
				if (paginator.currentPage < paginator.totalPages) {
					paginator.currentPage++;
					fetchData();
				}

				return false;
			});

			App.fetchData();

		},
		getUri:function()
		{
			var from = 0;
			if(paginator.currentPage > 1)
			{
				from = (paginator.currentPage - 1) *  paginator.pagesize
			}
			
			return paginator.uri.replace("{0}",paginator.pagesize).replace('{1}',from);
		},
		configure: function(totalResults){
			paginator.totalPages = Math.ceil(totalResults / paginator.pagesize);
			paginator.totalResults = totalResults;
			if(totalResults > 0)
			{
				if(paginator.currentPage == 0)
				{
					paginator.currentPage =1;
				}
			}
			paginator.setUI();
		},
		reset: function(totalResults){
			paginator.totalPages = 0;
			paginator.currentPage = 0;
			paginator.setUI();

		},
		setUI: function(){
			if (paginator.totalPages < 1) {
				pageInfo.innerHTML = " No results found";
			}
			else {
				var from = ((paginator.currentPage - 1) * paginator.pagesize) + 1;
				var to =  from + paginator.pagesize - 1;
				if(to > paginator.totalResults)
				{
					to = paginator.totalResults;
				}
				pageInfo.innerHTML = "Displaying " + from  + " - " + to + " of " + paginator.totalResults;
			}
		}
	}


	App.paginator = paginator;

}());


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
(function() {
	"use strict";

  var map,searchCircle,
  marker,
  infowindow,
  pageInfo ,t;
  
  var markersArray = [];

  var mapOptions = {
    zoom: 14,
    center: new google.maps.LatLng(51.5286416,-0.1015987),
    disableDefaultUI: true,
    zoomControl:true,
    zoomControlOptions: {
      style: google.maps.ZoomControlStyle.LARGE 
    },
    scrollwheel: true,
    draggable: true,
    panControl: true,
    scaleControl: true,
    mapTypeControl: true,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  var searchCircleOptions = {
    strokeColor: "#FF0000",
    strokeOpacity: 0.3,
    strokeWeight: 8,
    fillColor: "#fff",
    fillOpacity: 0.0,
    map: null,
    center: null,
    radius: 0
  }; 

  var marker_image = {
    url: 'img/marker.png',
    // This marker is 50 pixels wide by 82 pixels tall.
    size: new google.maps.Size(26, 41),
    // The origin for this image is 0,0.
    origin: new google.maps.Point(0,0),
    // The anchor for this image is the base at 25,82.
    anchor: new google.maps.Point(18, 41)
  };

  var milesRange = App.$('milesRange');
  
  App.getRadious = function(){ return Number(milesRange.value); };
  
  App.getSearchCenter = function(){ return { lat:marker.getPosition().lat(),lng:marker.getPosition().lng() };}

  App.AddMarker = function(posi,title,id)
  {
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(posi.lat, posi.lon),
      map: map,
      id:id,
      icon: marker_image,
      title: title
    });
    google.maps.event.addListener(marker, 'click', function() {
      App.fetchDetails(marker.id,showWindow,marker);
    });
    markersArray.push(marker);
  };

  App.ClearMarker =function()
  {
    clearOverlays();
  }
  
  App.ShowPopup =function(ref)
  {
    var id = ref.id;
    App.Log(id);
    for(var i in markersArray)
    {
      if(markersArray[i].id === id)
      {
          new google.maps.event.trigger( markersArray[i], 'click' );
          map.setCenter(markersArray[i].getPosition());
          map.setZoom(16)
          return;
      }
    }
    
  }

  var radiusText = App.$('txtRadious');

  var fitToCirleBounds = function(){
    map.fitBounds(searchCircle.getBounds());
    App.paginator.reset();
    App.fetchData()
  }


  var showWindow = function(marker, content){
     
      infowindow.setContent(content);
      infowindow.open(map,marker);
     
  }


  App.changeSearchRadious = function(e){

    var r = milesRange.value; 
    radiusText.innerHTML = r + " kilometers";
    //km= r * 1E3; 1609.344
    searchCircle.setOptions({
      radius: (r * 1000)
    });
  }



  var markerDragged = function(){
    var c = marker.getPosition();
    searchCircle.setOptions({
      center: c
    });
  }

  var toggleBounce = function(){
    if (marker.getAnimation() != null) {
      marker.setAnimation(null);
    }
    else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    }
  }

  var clearOverlays  = function(){
    if (markersArray) {
      for (var i in markersArray) {
        markersArray[i].setMap(null);
      }
      markersArray.length = 0;
    }
    infowindow.setMap(null);
  }

  var centerMaptoCircleCenter = function(){
    clearTimeout(t);
    t = setTimeout(function(){
      map.setCenter(marker.getPosition());
      App.paginator.reset();
      App.fetchData();
    }, 1000);
  }

  var centerMaptorequestedCenter = function(lat,lon){
   
      marker.position = new google.maps.LatLng(lat,lon);
      map.setCenter(marker.getPosition());
      markerDragged(); 
      fitToCirleBounds();
  }

  App.initializeMap = function initialize() {

    map = new google.maps.Map(App.$('rhc'),mapOptions);
    searchCircleOptions.map = map;
    searchCircleOptions.center = map.center;

    pageInfo = App.$('pageInfo');

    searchCircle = new google.maps.Circle(searchCircleOptions);
    var marker_image = new google.maps.MarkerImage(
      'img/crosshair.png',
      null,
         // The origin for my image is 0,0.
         new google.maps.Point(0, 0),
         // The center of the image is 16,16
         new google.maps.Point(16, 16)
         );
    marker = new google.maps.Marker({
      map: map,
      draggable: true,
      position: map.center,
      icon: marker_image
    });

    infowindow = new google.maps.InfoWindow({
      content: "" 
    });

    google.maps.event.addListener(marker, 'click', toggleBounce);
    google.maps.event.addListener(marker, 'drag', markerDragged);
    google.maps.event.addListener(marker, 'dragend', centerMaptoCircleCenter);

    App.addevent(milesRange, 'mouseup', fitToCirleBounds);
    App.centerMaptorequestedCenter = centerMaptorequestedCenter;
    App.changeSearchRadious();
  }

}());
(function() {
	"use strict";

	App.init = function(){

		App.Log("started...");
		App.initializeMap();
	}

}());