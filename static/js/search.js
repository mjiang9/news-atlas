var nameToCoords = {};
var nameToLevel = {};
var stateIDToName = {};

for (let state of statesData['features']) {
    let name = state['properties']['NAME']
    let coord = state['geometry']['coordinates']
    let id = state['properties']['STATE']
    let level = getLevel(coord)

    nameToCoords[name] = coord
    nameToLevel[name] = level
    stateIDToName[id] = name
}

for (let county of countyData['features']) {
    let id = county['properties']['STATE']
    let name = county['properties']['NAME'] + " County, " + stateIDToName[id]
    let coord = county['geometry']['coordinates']
    let level = getLevel(coord)

    nameToCoords[name] = coord
    nameToLevel[name] = level
}

var names = Object.keys(nameToCoords);

$("#search").on('input', function() {
    $("#search-result").empty()
    var v = search.value.toLowerCase();
    if (v !== "") {
        results = names.filter(name => name.toLowerCase().search(v) > -1).slice(0, 4)
        for (let result of results) {
            $item = $("<div>").addClass("search-item").html(result)
            $item.click(function() {
                var latlngs = L.GeoJSON.coordsToLatLngs(nameToCoords[result], nameToLevel[result]);
                var polygon = L.polygon(latlngs);
                map.fitBounds(polygon.getBounds(), {maxZoom: 7});

                if (result.includes("County")) {
                    let arr = result.split(", ");
                    let state = arr[arr.length - 1]
                    stateLayerOnClick(stateGeojson.getLayer(stateToLayerID[state]))
                    countyOnClickWithName(arr[0])
                } else {
                    stateLayerOnClick(stateGeojson.getLayer(stateToLayerID[result]))
                }
            })
            $("#search-result").append($item)
        }
    }
})

function getLevel(data) {
    let count = -3
    while (data !== undefined) {
        data = data[0]
        count++
    }
    return count
}