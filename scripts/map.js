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