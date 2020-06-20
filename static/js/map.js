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
    return d > 8000  ? '#BD0026' :
           d > 4000  ? '#E31A1C' :
           d > 2000  ? '#FC4E2A' :
           d > 1000   ? '#FD8D3C' :
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
    if (feature.properties['COUNTY'] != null) {
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

var popup = L.popup();
function movePopup(e) {
    type = (e.target.feature.properties['COUNTY'] != null) ? "county" : "state";
    popup.setContent("<b>" + e.target.feature.properties['NAME'] + (type == "county" ? " County" : "") +
                     "</b><br><i><small>Click to view " + type + " news</small></i>");
    dx = (type == "county") ? 0.5 : 0.75;
    popup.setLatLng(L.latLng(e.latlng.lat + dx, e.latlng.lng + dx)).openOn(map);
}

function highlightFeature(e) {
    var layer = e.target;
    layer.bindPopup(popup);
    layer.openPopup();

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
    e.target.closePopup();
    stateGeojson.resetStyle(e.target);
    if (map.hasLayer(countyGeojson)) {
        countyGeojson.resetStyle(e.target);
    }
    // info.update();
}

function resetMap() {
    Storage.set('cur_state', null)
    $("#info").html('<h4><b>National</b> COVID-19 News</h4>');
    getStateArticles('United States')

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

function getUSArticles() {
    fetch('/us')
    .then(function (response) {
        return response.json();
    }).then(function (text) {
        processUSResult(text)
    });
}

function processUSResult(text) {
    console.log(text)
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
    // articles = filter_news(articles, state, (selected ? selected.tag : null))

    console.log("filtered: " + articles.length + " articles about " + state + (selected ? ", " + selected.tag : ""));

    $("#info").html('<h4><b>' +  (state != 'United States' ? state : 'National') + '</b> COVID-19 News<br /></h4><hr>');

    // if (articles.length > 0) {
    //     var $img = $("<img>").attr({
    //     "src": articles[0].urlToImage,
    //     "style": "width: 280px; display: block; margin-left: auto; margin-right: auto;"
    //     });
    //     $("#info").append($img, "<br />");
    // }  
    
    if (text['keywords'].length) {
        keywords_text = "<b>Trending:</b> <i>"
        for (i = 0; i < text["keywords"].length; i++) {
            keywords_text += text["keywords"][i]
            if (i != text["keywords"].length - 1) keywords_text += " &middot; "
            else keywords_text += "</i>"
        }
        console.log(keywords_text)
        var $keywords = $("<div>", {"class": "keywords"}).html(keywords_text);
        $("#info").append($keywords);
    }

    var i;
    for (i = 0; i < articles.length; i++) {
        var $wrap = $("<div>", {id: "article" + i, "class": "article"});
        var $div = $("<a class=\"headline\" target=\"_blank\" href=\"" + articles[i].url + "\">").text(articles[i].title);
        $("#info").append($wrap);
        $($div).appendTo("#article" + i);
        var date = new Date(articles[i].publishedAt)
        var datestr = monthNames[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
        var $datesource = $("<div>", {"class": "datesource"}).text(datestr + " -- " + articles[i].source.name);
        $($datesource).appendTo("#article" + i);
        // $("#info").append($datesource);
        if (articles[i].urlToImage) {
            var $img = $("<img>").attr({
            "src": articles[i].urlToImage });
            $("#info").append($img);
        }
        $("#info").append("<br />");

        // $div.click({url: articles[i].url, date: articles[i].publishedAt, source: articles[i].source.name,
        // desc: articles[i].description, img: articles[i].urlToImage, state: state, id: i}, clickArticle);
    }
}

// function filter_news(articles, state, selected) {
//     results = []
//     relevant = []
//     for (i = 0; i < articles.length; i++) {
//         desc = articles[i].description + articles[i].content + articles[i].title + articles[i].url;
//         desc = desc.toLowerCase();
//         if (!desc.includes(state.toLowerCase()))
//             continue
//         if (selected && desc.includes(selected)) {
//             relevant.push(articles[i])
//             continue
//         }
//         results.push(articles[i])
//     }
//     console.log(relevant.length + " results")
//     return (relevant.length > 0 ? relevant : (results.length > 0 ? results : articles));
// }

var monthNames = [
  "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
];
var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];


// function clickArticle(e) {
//     console.log("clicked!");
//     console.log(e.data.desc);
//     // console.log(source);

//     if ($("#desc" + e.data.id).length) {
//         $("#desc" + e.data.id).remove();
//         return;
//     }
    
//     var $hide = $("<div>", {"class": "hide_button"}).text("[Hide]");
//     var date = new Date(e.data.date)
//     var datestr = monthNames[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
//     var $datesource = $("<div>", {"style": "font-size: 11px; cursor: auto; font-style: italic"}).text(datestr + " -- " + e.data.source);

//     $hide.click(function() {
//         console.log("unclicked!");
//         $("#desc" + e.data.id).remove();
//     })

//     var $desc = $("<div>)", {id: "desc" + e.data.id, "class": "desc"});
//     $desc.append($datesource);

//     $desc.append($("<small>").append($hide, e.data.desc, "<a target=\"_blank\" href=\"" + e.data.url + "\"> Read more</a>"));

//     $("#article" + e.data.id).after($desc);
// }

function stateOnClick(e) {
    var layer = e.target;
    layer.closePopup();
    getNewsState(layer.feature.properties);  
    zoomToFeature(e);
  
    if (map.hasLayer(countyGeojson))
        map.removeLayer(countyGeojson);

    if (lastStateLayer)
        lastStateLayer.on('click', stateOnClick);

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
        mousemove: movePopup,
        click: stateOnClick,
    });
}

function onEachCounty(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        mousemove: movePopup,
        click: countyOnClick,
    })
}

var stateGeojson = L.geoJson(statesData, {
    style: style,
    onEachFeature: onEachState
}).addTo(map);

map.on('zoomend', function(){
    if (map.getZoom() < 5) resetMap();
})

function onStart() {
    getStateArticles('United States')
    var today = new Date();
    $("#date").text(dayNames[today.getDay()] + ", " + monthNames[today.getMonth()] + " " + today.getDate() + ", " + today.getFullYear());
}
onStart();

map.whenReady(function(){
    $("#loader").hide();
    $("#info").css("display", "inline-block")
    $("#help").css("display", "inline-block")
})

var legend = L.control({position: 'bottomleft'});

legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'legendbox legend'),
        grades = [0, 250, 500, 1000, 2000, 4000, 8000],
        labels = [];

    div.innerHTML += '<h5 style=\"font-size: 13px;\"><b>Total Article Count</b></h5><h6 style=\"font-style: italic; margin-top: 8px; margin-bottom: 6px;\">Last 7 Days</h6>'

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<span class="br18"></span>' : '+');
    }

    return div;
};

legend.addTo(map);