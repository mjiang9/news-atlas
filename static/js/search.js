$("#countyscript").on("load", function(){
    var nameToCoords = {};
    var nameToLevel = {};
    var stateIDToName = {};

    // load states data
    for (let state of statesData['features']) {
        let name = state['properties']['NAME']
        let coord = state['geometry']['coordinates']
        let id = state['properties']['STATE']
        let level = getLevel(coord)

        nameToCoords[name] = coord
        nameToLevel[name] = level
        stateIDToName[id] = name
    }

    // load county data
    for (let county of countyData['features']) {
        let id = county['properties']['STATE']
        let name = county['properties']['NAME'] + " County, " + stateIDToName[id]
        let coord = county['geometry']['coordinates']
        let level = getLevel(coord)
    
        nameToCoords[name] = coord
        nameToLevel[name] = level
    }
    
    var names = Object.keys(nameToCoords);
    const NUM_MATCHES = 4; // number of matches shown

    $("#search").on('input', function() {
        $("#search-result").empty()
        var v = $("#search").val().toLowerCase();
        if (v !== "") {
            results = names.filter(name => name.toLowerCase().search(v) > -1).slice(0, NUM_MATCHES)
            for (let result of results) {
                $item = $("<div>").addClass("search-item").html(result)
                $item.click(function() {
                    // clear search
                    $("#search").val('')
                    $("#search-result").empty()

                    // zoom to location
                    var latlngs = L.GeoJSON.coordsToLatLngs(nameToCoords[result], nameToLevel[result]);
                    var polygon = L.polygon(latlngs);
                    map.fitBounds(polygon.getBounds(), {maxZoom: 7});

                    // simulate onclick behaviors
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
})

function getLevel(data) {
    let count = -3
    while (data !== undefined) {
        data = data[0]
        count++
    }
    return count
}