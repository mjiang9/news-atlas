// creates map
var mapboxAccessToken = "pk.eyJ1IjoiY2Z5dSIsImEiOiJjazlpMW8zazgxNGJ4M2ZvNGZ4c3BnaDk2In0.w2voJd0D3iz6s6KjouJ9pg";
var map = L.map('map').setView([37.8, -96], 4);

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + mapboxAccessToken, {
    id: 'mapbox/light-v9',
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    tileSize: 512,
    zoomOffset: -1
}).addTo(map);

var countyGeojson, stateGeojson;
var lastStateLayer;

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
    stateGeojson.resetStyle(e.target);
    if (map.hasLayer(countyGeojson)) {
        countyGeojson.resetStyle(e.target);
    }
    // info.update();
}

function resetMap() {
    if (map.hasLayer(countyGeojson))
    map.removeLayer(countyGeojson);

    if (lastStateLayer) {
        lastStateLayer.on('click', stateOnClick);
    }
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

function getNewsState(props) {
    var articles;
    console.log(props.name)
    Storage.set('cur_state', props.name)
    getStateArticles(props.name)
}

// replace this with database query later
function getStateArticles(state) {
    fetch('/news/' + state)
    .then(function (response) {
        return response.json();
    }).then(function (text) {
        console.log('GET response text:');
        articles = text["articles"];

        console.log(articles.length + " articles about " + state);

        selected = Storage.get('selected');
        articles = filter_news(articles, state, (selected ? selected.tag : null))

        console.log("filtered: " + articles.length + " articles about " + state + ", " + selected.tag);

        $("#info").html('<h4>Top' + (selected ? '<b> ' + selected.tagname + ' </b>' : ' ') + 
            'News for ' +  (state ? '<b>' + state + '</b><br /></h4>' : '</h4>Click a state'));

        if (articles.length > 0) {
            var $img = $("<img>").attr({
            "src": articles[0].urlToImage,
            "style": "width: 280px"
            });
            $("#info").append($img, "<br /><br />");
        }    

        var i;
        for (i = 0; i < articles.length; i++) {
            var $div = $("<div>", {id: "article" + i, "class": "headline"}).text(articles[i].title);
            $("#info").append($div, "<br />");

            $div.click({url: articles[i].url, date: articles[i].publishedAt, source: articles[i].source.name,
            desc: articles[i].description, img: articles[i].urlToImage, state: state, id: i}, clickArticle);
        }
    });
}

function filter_news(articles, state, selected) {
    results = []
    for (i = 0; i < articles.length; i++) {
        desc = articles[i].description + articles[i].content + articles[i].title;
        desc = desc.toLowerCase();
        if (!desc.includes(state.toLowerCase()))
            continue
        // if (selected && !desc.includes(selected.tag))
        //     continue
        results.push(articles[i])
    }

    return results
}

function clickArticle(e) {
    console.log("clicked!");
    console.log(e.data.desc);
    // console.log(source);

    if ($("#desc" + e.data.id).length) {
        $("#desc" + e.data.id).remove();
        return;
    }
    
    var $hide = $("<div>", {"class": "hide_button"}).text("[Hide]");

    $hide.click(function() {
        console.log("unclicked!");
        $("#desc" + e.data.id).remove();
    })

    var $desc = $("<div>)", {id: "desc" + e.data.id, "class": "desc"});
    $desc.append($("<small>").append($hide, e.data.desc, "<a target=\"_blank\" href=\"" + e.data.url + "\"> Read more</a>"));

    $("#article" + e.data.id).after($desc);
}

function stateOnClick(e) {
  var layer = e.target;
  getNewsState(layer.feature.properties);  
  zoomToFeature(e);
  resetMap();

  countyGeojson = L.geoJson(countyData, {
      style: style,
      onEachFeature: onEachCounty,
      filter: function(feature) {
          return feature.properties.STATE === layer.feature.id;
      }
  }).addTo(map);

  layer.off('click', stateOnClick);
  lastStateLayer = layer;
  lastZoomLevel = map.getZoom();
}

// add action
function countyOnClick(e) {
    return;
}

function onEachState(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: stateOnClick,
    });
}

function onEachCounty(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: countyOnClick,
    })
}

function onAdd(map) {
    this._div = document.getElementById("info");
    this.update();
    return this._div;
}

function update(props) {
    this._div.innerHTML = '<h4>Top News for</h4>' +  (props ?
        '<b>' + props.name + '</b><br />'+ props.density +
        ' people / mi<sup>2</sup>' : 'Click a state');
}

var stateGeojson = L.geoJson(statesData, {
    style: style,
    onEachFeature: onEachState
}).addTo(map);

map.on('zoomend', function(){
    if (map.getZoom() < 5) resetMap();
})
