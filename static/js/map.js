// creates map
var mapboxAccessToken = "pk.eyJ1IjoiY2Z5dSIsImEiOiJjazlpMW8zazgxNGJ4M2ZvNGZ4c3BnaDk2In0.w2voJd0D3iz6s6KjouJ9pg";
var map = L.map('mapid', {scrollWheelZoom: false}).setView([37.8, -96], 4);

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + mapboxAccessToken, {
    id: 'mapbox/light-v9',
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    tileSize: 512,
    zoomOffset: -1
}).addTo(map);

var geojson;

function getColor(d) {
    return d > 1000 ? '#800026' :
           d > 500  ? '#BD0026' :
           d > 200  ? '#E31A1C' :
           d > 100  ? '#FC4E2A' :
           d > 50   ? '#FD8D3C' :
           d > 20   ? '#FEB24C' :
           d > 10   ? '#FED976' :
                      '#FFEDA0';
}

function style(feature) {
    return {
        fillColor: getColor(feature.properties.density),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
    // info.update(layer.feature.properties);
}

function resetHighlight(e) {
    geojson.resetStyle(e.target);
    // info.update();
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

function getNewsState(props) {
    var articles;
    console.log(props.name)
    fetch('/news/' + props.name)
    .then(function (response) {
        return response.json();
    }).then(function (text) {
        console.log('GET response text:');
        articles = text["articles"]
        console.log(articles[0].description)
        articlestext = "<img src=\"" + articles[0].urlToImage + "\" style=\"width: 280px;\"><br /><br />"
        var i;
        for (i = 0; i < articles.length; i++)
          articlestext += articles[i].title + "<br /><br />";

        document.getElementsByClassName("info")[0].innerHTML =
            '<h4>Top News for ' +  (props ?
            '<b>' + props.name + '</b><br /></h4>'+
            articlestext : '</h4>Click a state');
    });
}

function getNews(e) {
  var layer = e.target;
  getNewsState(layer.feature.properties);
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: getNews,
        dblclick: zoomToFeature,
    });
}

function onAdd(map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
}

function update(props) {
    this._div.innerHTML = '<h4>Top News for</h4>' +  (props ?
        '<b>' + props.name + '</b><br />'+ props.density +
        ' people / mi<sup>2</sup>' : 'Click a state');
}

geojson = L.geoJson(statesData, {
    style: style,
    onEachFeature: onEachFeature
}).addTo(map);

var info = L.control();

info.onAdd = onAdd;
info.update = update;
info.addTo(map);
