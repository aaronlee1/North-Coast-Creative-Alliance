//Variable Declaration	
var map, mapCenter, locCol, fTableID, legend, markers, pointLayer, Column, subLayer, zoomLevel, firms, heatmapRadio, idx, which;
var layFirms, catBox, FirmsBox, laySA, selCat, selFir;


function initialize() {

//Variable Definition
  mapCenter = new google.maps.LatLng(46.7649885,-92.1112232);  
  fTableID = "1jPai26FlSqYV8QlaQtHSptgD3jIA9eNZGC4iWOoP";
  locCol = 'Address';
  
  map = new google.maps.Map(document.getElementById('map-canvas'), {
    center: mapCenter,
    zoom: 11
  });
  
  //Initialize the Google Fusion Tables Layer
  layFirms = new google.maps.FusionTablesLayer({
	query: { 
		select: locCol,
		from: fTableID
	}
  });
  initialLayer = new google.maps.FusionTablesLayer({
	query: {
		select: locCol,
		from: fTableID
	},
	
	styles: [{
		pointOptions: {
			fillColor: '#0099FF',
			fillOpoacity: 0.9
		}
	},{
		where: 'Niche = Arts and Entertainment',
		pointOptions:{
			fillColor: '#006666'
		}
	},{
		where: 'Niche = Boutique',
		pointOptions:{
			fillColor: '#00CC99'
		}
	},{
		where: 'Niche = Brewery',
		pointOptions:{
			fillColor: '#00CCFF'
		}
	},{	
		where: 'Niche = Cooperative',
		pointOptions:{
			fillColor: '#66FF66'
		}
	},{
		where: 'Niche = Culinary',
		pointOptions:{
			fillColor: '#0066FF'
		}
	},{
		where: 'Niche = Drinks and Conversation',
		pointOptions:{
			fillColor: '#3366CC'
		}
	},{
		where: 'Niche = Local Identity',
		pointOptions:{
			fillColor: '#339966'
		}
	},{
		where: 'Niche = Outdoor Outfitters',
		pointOptions:{
			fillColor: '#3366FF'
		}
	}]
  });
  var heatmap = new google.maps.visualization.HeatmapLayer();
  /*var saLayer = new google.maps.FusionTablesLayer({
	query: { 
		select: reach,
		from saTableID
	}
  });
  */
  
  // map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legend);
  // pointLayer = document.getElementById('Point');
  // heatmapLayer = document.getElementById('HeatmapLayer');
  // saLayer = document.getElementById('saLAYER');
  
 
  catBox = document.getElementById('Niche');
  FirmsBox = document.getElementById('Firms');
  
  getData("Niche");
  getData("Firms");
  
  markers = [];
  
  layFirms.setMap(null);
  initialLayer.setMap(map);
  
}
			

function getData(Column) {
	// var firms = new Array();
	// var latList = new Array();
	// var lonList = new Array();
	var query = "https://www.googleapis.com/fusiontables/v1/query?sql=SELECT "+Column +" FROM "+ fTableID +" ORDER BY "+ Column +"&key=AIzaSyAjYEWvtUDpX0WkI7_pKmlzwrMKgJnore4";
	var queryurl = encodeURI(query);
	if (Column =="Niche") {
		var dataQuer = $.get(queryurl, function(data) {
			dropdownFill(catBox, data);
			console.log(data);
		});
	}else if(Column == "Firms"){
		var dataQuer = $.get(queryurl, function(data) {
			dropdownFill(FirmsBox, data);
			console.log(data);
		});
	}
}

function dropdownFill(selectbox, data) {
	var List = new Array();
	for (var i=0; i <data.rows.length; i++) {
		if (List.indexOf(data.rows[i][0])==-1){
			List.push(data.rows[i][0]);
			addOption(selectbox, data.rows[i][0], data.rows[i][0]);
		}
	}
}

function addOption(selectbox,text, value){
	var entry = document.createElement("Option");
	entry.text = text;
	entry.value = value;
	selectbox.options.add(entry);
}


function clickCat(){
	selCat = catBox.value;
	selCatTxt = catBox.text;
	selFir = FirmsBox.value;
	
	if (selCat != 0) {
		var query = "https://www.googleapis.com/fusiontables/v1/query?sql=SELECT Firms FROM "+ fTableID +"  WHERE Niche='" + selCat + "'&key=AIzaSyAjYEWvtUDpX0WkI7_pKmlzwrMKgJnore4";
		var queryurl = encodeURI(query);
		var dataQuer = $.get(queryurl, CatUpdateHandler);
		updateMap();
	}else {
		var i;
		for (i = FirmsBox.options.length-1;i>=0;i--)
		{
			FirmsBox. remove(i);
		}
		addOption(FirmsBox, "Browse Creative Firms", "1");
	}
}

function CatUpdateHandler(data) {
	var i;
	for(i=FirmsBox.options.length-1;i>=0;i--)
	{
		FirmsBox.remove(i);
	}
	
	addOption(FirmsBox, "All", "0");
	
	dropdownFill(FirmsBox, data);
}

function clickFirms(){
	selCat = catBox.value;
	selFir = FirmsBox.value;
	
	if (selFir != 0) {
		var query = "https://www.googleapis.com/fusiontables/v1/query?sql=SELECT Firms FROM "+ fTableID +"  WHERE Firms='" + selFir + "'&key=AIzaSyAjYEWvtUDpX0WkI7_pKmlzwrMKgJnore4";
		var queryurl = encodeURI(query);
		var dataQuer = $.get(queryurl);
		searchCriteria("",dataHandlerCenter);
	}else {
		var i;
		for (i = FirmsBox.options.length-1;i>=0;i--)
		{
			
		}
		removeMarkers();
	}
}
			
		
function searchCriteria(Column, dataHandlerType) {
	if (selCat ==0) {
		if (selFir ==0) {
			sendRequest(" GROUP BY LatDec,LonDec", Column, dataHandlerType);
		}else { sendRequest("WHERE Firms ='"+ selFir + "'", Column, dataHandlerType);
		};
	}else { 
		if(selFir == 0) {
			sendRequest("WHERE Niche ='" + selCat + "'GROUP BY LatDec, LonDec", Column, dataHandlerType);
		}else { 
			sendRequest("WHERE Niche ='" + selCat + "'AND Firms='" + selFir + "'", Column, dataHandlerType);
		}
	}
}

function sendRequest(statement, column, dataHandlerType){
	if(dataHandlerType ==dataHandlerCenter) {
		removeMarkers();
	};
	var query = "https://www.googleapis.com/fusiontables/v1/query?sql=SELECT LatDec,LonDec"+ column +" FROM "+ tableID + statement +"&key=AIzaSyAjYEWvtUDpX0WkI7_pKmlzwrMKgJnore4";
	var queryurl = encodeURI(query);
	var dataQuer = $.get(queryurl, dataHandlerType)
	.done(function(){
		mapcenter = map.getCenter();
		zoomlevel = map.getZoom();
	});
}

function dataHandlerCenter(data) {
	if (data.hasOwnProperty('rows')){
		var bounds = new google.maps.LatLngBounds();
		for(i=0; i < data.rows.length; i++) {
			var point = new google.maps.LatLng(
				data.rows[i][0],
				data.rows[i][0]
			);
			var marker = new google.maps.Marker({
				position: point,
				map: map
			});
			markers.push(marker);
			bounds.extend(point);
		}
		
		map.fitBound(bounds);
	}else{
		alert("No data");
	};
}

function removeMarkers() {
	if(markers.length !=0) {
		for(var i = 0; i < markers.length; i++) {
			markers[i].setMap(null);
		};
		markers = [];
	}
}

function updateMap() {
	

	if(selCat !=0) {
		initialLayer.setMap(null);
		subLayer = new google.maps.FusionTablesLayer({
			query: {
				select: locCol,
				from: fTableID,
				where:" Niche = '" +selCat + "'"
			}
			
		});
	
	subLayer.setMap(map);
	
	}else if(selCat == 0){
		layFirms.setMap(map);
	}		
		
}



google.maps.event.addDomListener(window, 'load', initialize);