// Init map
var map = L.map('map', {
    center: [48.8566, 2.3522],
    zoom: 6,
    maxZoom: 15
});
// Relief map tiles
L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
}).addTo(map);

// Start and finish icon
var startIcon = L.divIcon({ className: 'custom-icon', html: '<i class="fa fa-play-circle" style="color: green;"></i>' });
var finishIcon = L.divIcon({ className: 'custom-icon', html: '<i class="fa fa-flag-checkered" style="color: red;"></i>' });

// Fetch coordinates of a location string
async function fetchCoordinates(location) {
    // Check if location is in sessionStorage
    const cachedLocation = sessionStorage.getItem(location);
    if (cachedLocation) {
        return JSON.parse(cachedLocation);
    }

    var response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
    const data = await response.json();
    if(data.length === 0) {
        // Try again with only the country inside the location in parentheses
        const country = location.match(/\(([^)]+)\)/)[1];
        response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(country)}`);
    }
    const coordinates = data.map(location => ({
        name: location.display_name,
        lat: parseFloat(location.lat),
        lon: parseFloat(location.lon)
    }));

    // Store in sessionStorage
    sessionStorage.setItem(location, JSON.stringify(coordinates));
    return coordinates;
}

function calcDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Find the closest pair of locations
async function closestLocation(start, finish) {
    const startCoords = await fetchCoordinates(start);
    const finishCoords = await fetchCoordinates(finish);

    let closestPair = null;
    let minDistance = Number.MAX_VALUE;
    for (const start of startCoords) {
        for (const finish of finishCoords) {
            const distance = calcDistance(start.lat, start.lon, finish.lat, finish.lon);
            if (distance < minDistance) {
                minDistance = distance;
                closestPair = {start, finish};
            }
        }
    }

    if (closestPair) {
        return closestPair;
    }
    return null;
}

// Update map
async function updateMap(year, stagesData) {
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('map').style.display = 'none';

    // Deactivate year selector
    document.getElementById('yearSelector').disabled = true;
    document.getElementById('prevYear').classList.add("disabled");
    document.getElementById('nextYear').classList.add("disabled");

    map.eachLayer(function (layer) {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
            map.removeLayer(layer);
        }
    });

    const stages = stagesData.filter(row => row.Year == year);
    const coordinates = [];
    for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        document.getElementById('loading').textContent = `Loading stage ${i + 1} of ${stages.length}...`;

        if (stage.Course) {
            // Also remove the [a] part if it exists
            stage.Course = stage.Course.replace(/\[.*?\]/g, '');
            // Remove everything after the via part if it exists
            stage.Course = stage.Course.split(' via ')[0];
            const courseParts = stage.Course.split(' to ');
            if (courseParts.length === 1) {
                const coords = await fetchCoordinates(courseParts[0]);
                if (coords) {
                    coordinates.push([coords[0].lat, coords[0].lon]);
                    L.marker([coords[0].lat, coords[0].lon], { icon: startIcon }).addTo(map).bindPopup(`${stage.Course} Start/Finish`);
                }
            }
            if (courseParts.length === 2) {
                const closestLocations = await closestLocation(courseParts[0], courseParts[1]);
                if (closestLocations) {
                    const startCoords = [closestLocations.start.lat, closestLocations.start.lon];
                    const finishCoords = [closestLocations.finish.lat, closestLocations.finish.lon];
                    coordinates.push(startCoords, finishCoords);
                    L.marker(startCoords, { icon: startIcon }).addTo(map).bindPopup(`${stage.Course} Start`);
                    L.marker(finishCoords, { icon: finishIcon }).addTo(map).bindPopup(`${stage.Course} Finish`);
                    L.polyline([startCoords, finishCoords], { color: 'blue' }).addTo(map).bindPopup(`${stage.Course} Route`);

                    // Add stage number
                    // const midPoint = [(parseFloat(startCoords[0]) + parseFloat(finishCoords[0])) / 2, (parseFloat(startCoords[1]) + parseFloat(finishCoords[1])) / 2];
                    // const stageNumberIcon = L.divIcon({ className: 'stage-number', html: `<p>${i + 1}</p>` });
                    // L.marker(midPoint, { icon: stageNumberIcon }).addTo(map);
                }
            }
        }
    }

    document.getElementById('loading').style.display = 'none';
    document.getElementById('map').style.display = 'block';
    // Activate year selector
    document.getElementById('yearSelector').disabled = false;
    document.getElementById('prevYear').classList.remove("disabled");
    document.getElementById('nextYear').classList.remove("disabled");
    map.invalidateSize();    
    if (coordinates.length > 0) {
        const bounds = L.latLngBounds(coordinates);
        map.fitBounds(bounds);
    }
}