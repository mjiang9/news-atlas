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
    dx = (type == "county" || map.getZoom() > 5) ? 0.5 : 0.75;
    dy = dx;
    if (e.latlng.lat + 3 > map.getBounds().getNorth())
        dy = (type == "county" || map.getZoom() > 5) ? -1 : -3.5;
    if (e.latlng.lng + 5 < map.getBounds().getWest())
        dx = (type == "county" || map.getZoom() > 5) ? -2 : -5;
    if (map.getZoom() > 7) {
        dx = dx/2;
        dy = dy/2;
    }
    popup.setLatLng(L.latLng(e.latlng.lat + dy, e.latlng.lng + dx)).openOn(map);
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
        processCountyResult(county, text)
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

function processCountyResult(county, text) {
    articles = text["articles"];
    selected = Storage.get('selected');

    console.log("filtered: " + articles.length + " articles about " + county + (selected ? ", " + selected.tag : ""));

    $("#info").prepend('<div id=\'countyheader\'><h4><b>' +  county + '</b> COVID-19 News<br /></h4><hr>');
    
    if (articles.length == 0) {
        $("#countyheader").append("<div style=\"margin-bottom: 25px;margin-top: 10px;color: dimgray;\">" + "No articles found for " + county + ". </div>");
    }
    
    if (text['keywords'].length) {
        keywords_text = "<b>Trending:</b> <i>"
        for (i = 0; i < text["keywords"].length; i++) {
            keywords_text += text["keywords"][i]
            if (i != text["keywords"].length - 1) keywords_text += " &middot; "
            else keywords_text += "</i>"
        }
        var $keywords = $("<div>", {"class": "keywords"}).html(keywords_text);
        $("#countyheader").append($keywords);
    }

    var i;
    for (i = 0; i < articles.length; i++) {
        var $wrap = $("<div>", {id: "article" + i, "class": "article"});
        var $div = $("<a class=\"headline\" target=\"_blank\" href=\"" + articles[i].url + "\">").text(articles[i].title);
        $("#countyheader").append($wrap);
        $($div).appendTo("#article" + i);
        var date = new Date(articles[i].publishedAt)
        var datestr = monthNames[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
        var $datesource = $("<div>", {"class": "datesource"}).text(datestr + " -- " + articles[i].source.name);
        $($datesource).appendTo("#article" + i);
        // $("#info").append($datesource);
        if (articles[i].urlToImage) {
            var $img = $("<img>").attr({
            "src": articles[i].urlToImage });
            $("#countyheader").append($img);
        }
        $("#countyheader").append("<br />");
    }
    $('#countyheader').append('<hr></div>')

}

function trimlink(link, k) {
    if (link.length < k) return link;
    return link.substring(0,k) + "..."
}
function trimnum(num) {
    if (num > 1000000) return Math.round(num/1000000 *100)/100 + "M";
    if (num > 10000) return Math.round(num/1000 *100)/100 + "K";
    if (num > 1000) {
        if (num%1000 < 100) return Math.round(num/1000) + ",0" + num%1000;
        return Math.round(num/1000) + "," + num%1000;
    }
    return num;
}

function processNewsResult(state, text) {
    articles = text["articles"];
    selected = Storage.get('selected');

    console.log("filtered: " + articles.length + " articles about " + state + (selected ? ", " + selected.tag : ""));

    $("#info").html('<h4><b>' +  (state != 'United States' ? state : 'National') + '</b> COVID-19 News<br /></h4><hr>');
    
    if (text['keywords'].length) {
        keywords_text = "<b>Trending:</b> <i>"
        for (i = 0; i < text["keywords"].length; i++) {
            keywords_text += text["keywords"][i]
            if (i != text["keywords"].length - 1) keywords_text += " &middot; "
            else keywords_text += "</i>"
        }
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
    }
    us_cases = text['covinfo']['counts']['USA']['cases']
    us_deaths = text['covinfo']['counts']['USA']['deaths']
    us_covlink = text['covinfo']['info']['USA']

    helplinks = covid_help_links[state]
    $("#covinfo1").html("<b><big>US &#8202; | &#8202; Cases: </b>" + trimnum(us_cases) + "<b> &#8202; Deaths: </b>" + trimnum(us_deaths) + "</big><br>");
    $("#covinfo1").append("Learn more: <a href=\"" + us_covlink + "\">" + us_covlink+ "</a><br>")
    $("#covinfo2").html("<b><big>Take Action: </big></b>"+ "<br>")
    if (state == 'United States') {
        for (i = 0; i < Math.min(3,helplinks.length); i++) {
            $("#covinfo2").append("<div class='link-div'><a class='helplink' target=\"_blank\" href=\"" +helplinks[i].link + "\">" + helplinks[i].title + "</a></div>")
        }
    }
    else {
        state_cases = text['covinfo']['counts'][state]['cases']
        state_deaths = text['covinfo']['counts'][state]['deaths']
        state_covlink = text['covinfo']['info'][state]
        $("#covinfo1").prepend("<b><big>" + state + " &#8202; | &#8202; Cases: </b>" + trimnum(state_cases) + "<b> &#8202; Deaths: </b>" + trimnum(state_deaths) + "</big><br>" +
            "<div class='link-div'>Learn more: <a href=\"" + state_covlink + "\">" + state_covlink + "</a></div><span style=\"display: block;height: 8px;\"></span>")
        for (i = 0; i < Math.min(3,helplinks.length); i++) {
            $("#covinfo2").append("<div class='link-div'><a class='helplink' target=\"_blank\" href=\"" + helplinks[i].link + "\">" + helplinks[i].title + "</a></div>")
        }
        helplinks = covid_help_links['United States']
        for (i = 0; i < Math.min(3,helplinks.length); i++) {
            $("#covinfo2").append("<div class='link-div'><a class='helplink' target=\"_blank\" href=\"" +helplinks[i].link + "\">" + helplinks[i].title + "</a></div>")
        }
    }  
    plotState(state)  
}

var monthNames = [
  "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
];
var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

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
    if ($('#countyheader').length)
        $('#countyheader').remove()
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

function plotState(state) {
    fetch('/covidhistory/' + state)
    .then(function (response) {
        return response.json();
    }).then(function (text) {
        var trace1 = {
          x: text['dates'],
          y: text['cases'],
          type: 'scatter'
        };

        var data = [trace1];

        Plotly.newPlot('covinfo1', data);
    });
}