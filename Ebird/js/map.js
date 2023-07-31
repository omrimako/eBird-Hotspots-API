API_KEY = 'khvVGD9ThOCYQHMkBNt5'
var centerPoint = [-79, 43.5] //Toronto coordinates
var lngLat = [0, 0]
document.getElementById("overlay").style.display = "none"
var map = new maplibregl.Map({
    container: 'map',
    style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${API_KEY}`, // stylesheet location
    center: centerPoint, // starting position [lng, lat]
    zoom: 9 // starting zoom
});
// Add geolocate control to the map.
geolocate = new maplibregl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    trackUserLocation: true
})
//add icon
map.addControl(
    geolocate
);
// Add zoom and rotation controls to the map.
    map.addControl(new maplibregl.NavigationControl());

// Listen for the 'geolocate' event
geolocate.on('geolocate', function (e) {
    // Access the user's current location coordinates
    lngLat = [e.coords.longitude, e.coords.latitude];
    // Create a marker at the given location
    var marker = new maplibregl.Marker().setLngLat(lngLat).addTo(map);
    document.getElementById("overlay").style.display = "block"

});
//load radius based on function call
map.on('load', function () {
    // document.getElementById('map-overlay').style.display = "none"; // Hide slider
    document
        .getElementById('slider')
        .addEventListener('input', function (e) {
            show_radius_on_map(e.target.value)
        });

    document.getElementById('submit').addEventListener('click', function (event) {
        get_hotspots()
    })


}
)


// Helper function to generate circle polygon coordinates
function generateCirclePolygon(center, radius) {

    var point = turf.point(center); // Example point coordinates
    var buffered = turf.buffer(point, radius, { units: 'kilometers' }); // Example buffer distance

    return buffered;
}

function get_hotspots() {
    var radius = document.getElementById('slider').value // read  km radius from submit 
    var url = `https://api.ebird.org/v2/ref/hotspot/geo?lat=${lngLat[1]}&lng=${lngLat[0]}&back=30&dist=${radius}&fmt=json`; 
    console.log(url)


    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            // Perform further actions with the response data

            var geojson = generate_geojson_hot_spot_sightings(data);
            // Check if the layer exists on the map.
            if (map.getLayer('locations')) {
                // Remove the layer from the map.
                map.removeLayer('locations');
            }

            // Check if the source exists on the map.
            if (map.getSource('locations')) {
                // Remove the source from the map.
                map.removeSource('locations');
            }
            console.log(geojson)
            map.addSource('locations', {
                'type': 'geojson',
                'data': geojson
            });
               // define hotspots property
            map.addLayer({
                'id': 'locations',
                'type': 'circle',
                'source': 'locations',
                'paint': {
                    'circle-radius': 10,
                    'circle-color': '#FF0000'
                }
            });
        })
        .catch(error => {
            console.log('Error:', error);
        });

}

function show_radius_on_map(radius_value) {
    // Set the label to the radius
    document.getElementById('radius_value').textContent = `${radius_value} [KM]`;

    // Check if the layer exists on the map.
    if (map.getLayer('radius')) {
        // Remove the layer from the map.
        map.removeLayer('radius');
    }

    // Check if the source exists on the map.
    if (map.getSource('radius')) {
        // Remove the source from the map.
        map.removeSource('radius');
    }

    map.addSource('radius', {
        type: 'geojson',
        data: generateCirclePolygon(lngLat, radius_value)
});
        //define radius property
    map.addLayer({
        'id': 'radius',
        'type': 'fill',
        'source': 'radius',
        'layout': {},
        'paint': {
            'fill-color': '#ff0000',
            'fill-opacity': 0.2
        }
    });
}

function generate_geojson_hot_spot_sightings(inputList) {
    // create geojson of ghot spots
    const features = inputList.map(item => {
        const { locName, lat, lng, ...properties } = item;
        return {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [lng, lat]
            },
            properties: {
                locName,
                ...properties
            }
        };
    });

    const geojson = {
        type: "FeatureCollection",
        features
    };

    console.log(JSON.stringify(geojson, null, 2));

    return geojson;




}  // Add popups to the map
map.on('click', 'locations', (e) => {
    const coordinates = e.features[0].geometry.coordinates.slice();
    const properties = e.features[0].properties;

    // Create the popup 
    new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(`<h3>${properties.locName}</h3><p><a href="#" onClick="window.open('https://ebird.org/hotspot/${properties.LocId}', '_blank')">Visit site!</a></p>`)
        .addTo(map);                           
});

// Change the cursor to a pointer when hovering over the locations layer
map.on('mouseenter', 'locations', () => {
    map.getCanvas().style.cursor = 'pointer';
});

// Change the cursor back to the default when not hovering over the locations layer
map.on('mouseleave', 'locations', () => {
    map.getCanvas().style.cursor = '';
});