var Storage = {
    set: function(key, value) {
        localStorage[key] = JSON.stringify(value);
    },
    get: function(key) {
        return localStorage[key] ? JSON.parse(localStorage[key]) : null;
    }
};

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
    return d > 10000 ? '#800026' :
           d > 5000  ? '#BD0026' :
           d > 2000  ? '#E31A1C' :
           d > 1000  ? '#FC4E2A' :
           d > 750   ? '#FD8D3C' :
           d > 500   ? '#FEB24C' :
           d > 250   ? '#FED976' :
                      '#FFEDA0';
}

function numArticles(state) {
    fetch('/news/' + state)
    .then(function (response) {
        return response.json();
    }).then(function (text) {
        counts = Storage.get('counts')
        counts[state] = text['totalResults']
        Storage.set('counts', counts);
        console.log("totalResults: ", counts[state], state, Object.keys(counts).length);
        stateGeojson.resetStyle();
    });
}

function style(feature) {
    if (feature.properties['LSAD'] == 'County') {
        // console.log(feature.properties['NAME'])
        // counts = countdict[feature.properties['NAME']];
        count = 0
    } else {
        counts = Storage.get('counts')
        if (counts && counts[feature.properties['NAME']] != null) count = counts[feature.properties['NAME']];
        else {
            count = countdict[feature.properties['NAME']]; // defaults
            if (counts == null) counts = {}
            counts[feature.properties['NAME']] = count; // pending, not null, so it doesn't get called again
            Storage.set('counts', counts)
            numArticles(feature.properties['NAME']);
        }
    }
    return {
        fillColor: getColor(count),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

function highlightFeature(e) {
    // if (Storage.get('cur_state') == e.target.feature.properties['NAME'])
    //     return;
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });
    if (Storage.get('cur_state') == e.target.feature.properties['NAME'])
        return;
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
    console.log(props.NAME)
    Storage.set('cur_state', props.NAME)
    getStateArticles(props.NAME)
}

function getCountyArticles(county, state) {
    fetch('/news/' + state + "/" + county)
    .then(function (response) {
        return response.json();
    }).then(function (text) {
        processNewsResult(county, text)
    });
}

function getStateArticles(state) {
    fetch('/news/' + state)
    .then(function (response) {
        return response.json();
    }).then(function (text) {
        processNewsResult(state, text)
    });
}

function processNewsResult(state, text) {
    console.log('GET response text:');
    articles = text["articles"];

    console.log(articles.length + " articles about " + state);

    selected = Storage.get('selected');
    articles = filter_news(articles, state, (selected ? selected.tag : null))

    console.log("filtered: " + articles.length + " articles about " + state + (selected ? ", " + selected.tag : ""));

    $("#info").html('<h4>Top' + (selected ? '<b> ' + selected.tagname + ' </b>' : ' ') + 
        'News for ' +  (state ? '<b>' + state + '</b><br /></h4>' : '</h4>Click a state'));

    if (articles.length > 0) {
        var $img = $("<img>").attr({
        "src": articles[0].urlToImage,
        "style": "width: 280px; display: block; margin-left: auto; margin-right: auto;"
        });
        $("#info").append($img, "<br />");
    }    

    var i;
    for (i = 0; i < articles.length; i++) {
        var $div = $("<div>", {id: "article" + i, "class": "headline"}).text(articles[i].title);
        $("#info").append($div, "<br />");
        $div.click({url: articles[i].url, date: articles[i].publishedAt, source: articles[i].source.name,
        desc: articles[i].description, img: articles[i].urlToImage, state: state, id: i}, clickArticle);
    }
}

function filter_news(articles, state, selected) {
    results = []
    relevant = []
    for (i = 0; i < articles.length; i++) {
        desc = articles[i].description + articles[i].content + articles[i].title + articles[i].url;
        desc = desc.toLowerCase();
        if (!desc.includes(state.toLowerCase()))
            continue
        if (selected && desc.includes(selected)) {
            relevant.push(articles[i])
            continue
        }
        results.push(articles[i])
    }
    console.log(relevant.length + " results")
    return (relevant.length > 0 ? relevant : (results.length > 0 ? results : articles));
}

var monthNames = [
  "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
];

function clickArticle(e) {
    console.log("clicked!");
    console.log(e.data.desc);
    // console.log(source);

    if ($("#desc" + e.data.id).length) {
        $("#desc" + e.data.id).remove();
        return;
    }
    
    var $hide = $("<div>", {"class": "hide_button"}).text("[Hide]");
    var date = new Date(e.data.date)
    var datestr = monthNames[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
    var $datesource = $("<div>", {"style": "font-size: 11px; cursor: auto; font-style: italic"}).text(datestr + " -- " + e.data.source);

    $hide.click(function() {
        console.log("unclicked!");
        $("#desc" + e.data.id).remove();
    })

    var $desc = $("<div>)", {id: "desc" + e.data.id, "class": "desc"});
    $desc.append($datesource);

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
          return feature.properties.STATE === layer.feature.properties.STATE;
      }
  }).addTo(map);

  layer.off('click', stateOnClick);
  lastStateLayer = layer;
  lastZoomLevel = map.getZoom();
}

// add action
function countyOnClick(e) {
    county = e.target.feature.properties['NAME'] + " County"
    state = Storage.get('cur_state')
    console.log("Clicked " + county + ", " + state)
    getCountyArticles(county, state)
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

// function onAdd(map) {
//     this._div = document.getElementById("info");
//     this.update();
//     return this._div;
// }

function update(props) {
    this._div.innerHTML = '<h4>Top News for</h4>' +  (props ?
        '<b>' + props.NAME + '</b><br />' : 'Click a state');
}

var stateGeojson = L.geoJson(statesData, {
    style: style,
    onEachFeature: onEachState
}).addTo(map);

map.on('zoomend', function(){
    if (map.getZoom() < 5) resetMap();
})

var legend = L.control({position: 'bottomleft'});

legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'legendbox legend'),
        grades = [0, 250, 500, 750, 1000, 2000, 5000, 10000],
        labels = [];

    div.innerHTML += '<h5><b>Total Article Count</b></h5><h6>(Last 7 Days)</h6>'

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
};

legend.addTo(map);