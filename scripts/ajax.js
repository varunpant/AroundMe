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