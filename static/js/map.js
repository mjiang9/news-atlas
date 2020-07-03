var Storage = {
    set: function(key, value) {
        localStorage[key] = JSON.stringify(value);
    },
    get: function(key) {
        return localStorage[key] ? JSON.parse(localStorage[key]) : null;
    }
};

document.getElementById("countyscript").onload = function(){ 
    console.log("loaded county maps")
    $('.loadingio-spinner-ellipsis-30ulp74dpur').remove()
    $('#countyloadingtext').remove()
    $('#help').prepend('<i id="helptext">Click a state on the map to view recent state- and county-level news and info, zoom out to return to national-level display</i><hr id="helphr" style="margin: 3px">');
}



// creates map
var mapboxAccessToken = "pk.eyJ1IjoiY2Z5dSIsImEiOiJjazlpMW8zazgxNGJ4M2ZvNGZ4c3BnaDk2In0.w2voJd0D3iz6s6KjouJ9pg";
var map = L.map('map', {
    minZoom: 3,
    maxBounds: [[-23.2, -226], [77.8, -6]]
}).setView([37.8, -96], 4);

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + mapboxAccessToken, {
    id: 'mapbox/light-v9',
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    tileSize: 512,
    zoomOffset: -1
}).addTo(map);

var countyGeojson, stateGeojson;
var lastStateLayer;
var stateToLayerID = {};

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
    if (e.target.feature.properties['NAME'] == 'District of Columbia')
        type = "state";
    popup.setContent("<b>" + e.target.feature.properties['NAME'] + (type == "county" ? " County" : "") +
                     "</b><br><i><small>Click to view " + type + " news</small></i>");
    dx = (map.getBounds().getEast()-map.getBounds().getWest())/15; 
    dy = (map.getBounds().getNorth()-map.getBounds().getSouth())/25;
    if (map.getBounds().getEast() < e.latlng.lng + dx*2)
        dx = -dx*1.5;
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
    if (Storage.get('cur_state') == null)
        return
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
    if (county == 'District of Columbia')
        county = ''

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

function getCovidInfoDiv(location, cases, deaths, link) {
    $covid_info = $("<div>");
    $graph = $("<div>").attr("id", location + " Graph").css("display", "inline-block");
    $location = $("<div>").html("<h4><b>&#8202; &#183; &#8202;" + location + "</b></h4>").css({
        "top": "-10px",
        "position": "relative",
        "display": "inline-block"
    })
    $cases_and_death = $("<div>").html("<i><big>Cases: </i>" + trimnum(cases) + "<i> &#8202; Deaths: </i>" + trimnum(deaths) + "</big><br>").css({
        "top": "-10px",
        "position": "relative",
    })
    $link = $("<div>").html("Learn more: <a target=\"_blank\" href=\"" + link + "\">" + link+ "</a><br>").addClass("link-div").css({
        "top": "-10px",
        "position": "relative",
    })
    $link2 = $("<div>").html("NYC Velocity Map: <a target=\"_blank\" href=\"http://covidvelocity.com\">http://covidvelocity.com</a><br>").addClass("link-div").css({
        "top": "-15px",
        "position": "relative",
    })


    $graph.click(function() {plotBigGraph(location)})

    $covid_info.append($graph, $location, $cases_and_death, $link)
    if (location == "New York")
        $covid_info.append($link2)
    $("#covinfo1").prepend($covid_info)
    plotSmallGraph(location, $graph.attr('id'))
    
    $graph.on('plotly_afterplot', function() {
        $(".nsewdrag").css("cursor", "pointer")
        $(".plot-container").wrap("<a href=\"#\" data-toggle=\"tooltip\" title=\"Click to expand graph\"></a>")
        $(document).ready(function(){
          $('[data-toggle="tooltip"]').tooltip();   
        });
    })
}

function processNewsResult(state, text) {
    articles = text["articles"];
    selected = Storage.get('selected');

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
    $("#covinfo1").empty()
    getCovidInfoDiv("United States", us_cases, us_deaths, us_covlink)

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
        getCovidInfoDiv(state, state_cases, state_deaths, state_covlink)
        for (i = 0; i < Math.min(3,helplinks.length); i++) {
            $("#covinfo2").append("<div class='link-div'><a class='helplink' target=\"_blank\" href=\"" + helplinks[i].link + "\">" + helplinks[i].title + "</a></div>")
        }
        helplinks = covid_help_links['United States']
        for (i = 0; i < Math.min(3,helplinks.length); i++) {
            $("#covinfo2").append("<div class='link-div'><a class='helplink' target=\"_blank\" href=\"" +helplinks[i].link + "\">" + helplinks[i].title + "</a></div>")
        }
    }  
}

var monthNames = [
  "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
];
var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function stateOnClick(e) {
    var layer = e.target;
    stateLayerOnClick(layer)
    zoomToFeature(e);
}

function stateLayerOnClick(layer) {
    layer.closePopup();
    getNewsState(layer.feature.properties);  

    if (map.hasLayer(countyGeojson))
        map.removeLayer(countyGeojson);

    if (lastStateLayer)
        lastStateLayer.on('click', stateOnClick);

    if (typeof countyData !== 'undefined') {
        countyGeojson = L.geoJson(countyData, {
            style: style,
            onEachFeature: onEachCounty,
            filter: function(feature) {
                return feature.properties.STATE === layer.feature.properties.STATE;
            }
        }).addTo(map);
    } else {
        console.log("County data not ready");
    }

    $(".back-button").css("display", "block")
    layer.off('click', stateOnClick);
    lastStateLayer = layer;
    lastZoomLevel = map.getZoom();
}

function countyOnClick(e) {
    county = e.target.feature.properties['NAME'] + " County"
    if (e.target.feature.properties['NAME'] == 'District of Columbia')
        county = ''
    countyOnClickWithName(county)
}

function countyOnClickWithName(county) {
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

stateGeojson.eachLayer(function (layer) {
    stateToLayerID[layer.feature.properties.NAME] = stateGeojson.getLayerId(layer)
})

map.on('zoomend', function(e){
    if (map.getZoom() < 5) {
        resetMap();
        $(".back-button").css("display", "none")
    }
    else {
        $(".back-button").css("display", "block")
    }
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


var back_button = L.control({position: 'bottomleft'});

back_button.onAdd = function (map) {
    let div = L.DomUtil.create('div', 'back-button');
    div.innerHTML += '<b>Back to Main</b>'
    L.DomEvent.addListener(div, 'click', function(){ map.setView([37.8, -96], 4); })
    return div;
}

back_button.addTo(map)

function plotSmallGraph(state, div) {
    fetch('/covidhistory/' + state)
    .then(function (response) {
        return response.json();
    }).then(function (text) {
        var trace1 = {
          x: text['dates'],
          y: text['cases'],
          mode: 'scatter'
        };

        var data = [trace1];

        var layout = {
            width: 35,
            height: 35,
            hovermode: false,
            margin: {
                l: 2,
                r: 0,
                b: 2,
                t: 0,
                pad: 0
            },
            xaxis: {
                showgrid: false,
                showline: true,
                showticklabels: false,
                zeroline: false,
                linewidth: 2
            },
            yaxis: {
                showgrid: false,
                showline: true,
                showticklabels: false,
                zeroline: false,
                linewidth: 2
            }
        }
        Plotly.newPlot(div, data, layout, {displayModeBar: false});
    });
}

function dateToString(date) {
    return date.toString().substring(4, 6) + "/" + date.toString().substring(6, 8)
}

function closeGraph(e) {
    if (e.target !== this) return;
    $plot_modal.empty()
    $plot_modal.remove()
}

function plotBigGraph(state) {
    fetch('/covidhistory/' + state)
    .then(function (response) {
        return response.json();
    }).then(function (text) {
        var trace1 = {
          x: text['dates'].map(x => dateToString(x)),
          y: text['cases'],
          mode: 'scatter'
        };

        var data = [trace1];

        var layout = {
            title: {
                text: 'Number of Cases in ' + state,
                x: 0.55
            },
            width: 500,
            height: 500,
            margin: {
                l: 55,
                r: 15,
                b: 40,
                t: 80,
                pad: 0
            },
            xaxis: {
                showgrid: false,
                showline: true,
                showticklabels: true,
                tick0: 0,
                dtick: 25,
                zeroline: false,
                linewidth: 2
            },
            yaxis: {
                showgrid: false,
                showline: true,
                showticklabels: true,
                zeroline: false,
                linewidth: 2
            }
        }

        $plot_modal = $("<div>").addClass("modal")
        $plot_box = $("<div>").addClass("plot-box")
        $big_plot = $("<div>").attr("id", "Big " + state + " Plot")
        $close_plot = $("<span>").html("&times;").addClass("close");
        
        $plot_box.append($close_plot, $big_plot)
        $plot_modal.append($plot_box)
        $plot_modal.appendTo(document.body)

        $plot_modal.click(closeGraph)
        $close_plot.click(closeGraph)
 
        Plotly.newPlot($big_plot.attr("id"), data, layout);
    });
}
