// This file contains all the JavaScript logic to initialize and interact with the map.
//It interacts with the Mapbox API, creates map layers, adds markers, and handles interactivity.
// Mapbox Access Token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2lhc2FtYSIsImEiOiJjbTN5dzV2a2cxN2hvMmpvZnVmYTIyenc5In0.7ZYRDMdIOyZbDGLT9UL2pA';

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/siasama/cm3yuzs0000iv01qqgsaogtzl',
    center: [-122.2595, 37.8721], // UC Berkeley center
    zoom: 15
});

// Define the bounding box for UC Berkeley
const bounds = [
    [-122.2750, 37.8650], // Southwest corner
    [-122.2500, 37.8800]  // Northeast corner
];
map.setMaxBounds(bounds);

// Fetch data from files
async function fetchData() {
    try {
        const schedulesResponse = await fetch('schedules.json');
        const locationsResponse = await fetch('locations.json');
        const schedules = await schedulesResponse.json();
        const locations = await locationsResponse.json();

        console.log('Data fetched successfully:', { schedules, locations });
        return { schedules, locations };
    } catch (err) {
        console.error('Error fetching data:', err);
        return { schedules: null, locations: null }; // Return empty values on error
    }
}

// Determine if a room is available
function isRoomAvailable(schedule, day, time) {
    const periods = schedule[day] || [];
    return periods.some(({ start, end }) => time >= start && time <= end);
}

// Fetch locations and schedules and add markers
fetch('locations.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load locations.json');
        }
        return response.json();
    })
    .then(locations => {
        fetch('schedules.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load schedules.json');
                }
                return response.json();
            })
            .then(schedules => {
                // Call addMarkers after successfully fetching data
                addMarkers(map, locations, schedules);
            })
            .catch(error => {
                console.error('Error loading schedules:', error);
            });
    })
    .catch(error => {
        console.error('Error loading locations:', error);
    });

// Add markers and populate the side panel with open rooms
function addMarkers(map, locations, schedules) {
    const now = new Date();
    const day = now.toLocaleString('en-US', { weekday: 'long' });
    const time = now.toTimeString().split(' ')[0]; // Current time in HH:MM:SS format

    const buildingList = document.getElementById('building-list');
    buildingList.innerHTML = ''; // Clear previous entries

    const buildingsData = {}; // Store open rooms grouped by building

    locations.forEach(location => {
        const { name, longitude, latitude } = location;
        const openRooms = [];

        // Check if any room in the building is open
        Object.entries(schedules).forEach(([room, schedule]) => {
            if (room.includes(name)) {
                const available = isRoomAvailable(schedule, day, time);
                if (available) {
                    openRooms.push(room);
                }
            }
        });

        if (openRooms.length > 0) {
            // Add building and its open rooms to buildingsData
            buildingsData[name] = openRooms;

            // Add a green marker for open buildings
            new mapboxgl.Marker({ color: 'green' })
                .setLngLat([parseFloat(longitude), parseFloat(latitude)])
                .setPopup(new mapboxgl.Popup().setHTML(`
                    <h3>${name}</h3>
                    <p>Status: Open</p>
                    <p>Open Rooms: ${openRooms.join(', ')}</p>
                `))
                .addTo(map);
        } else {
            // Add a red marker for closed buildings
            new mapboxgl.Marker({ color: 'red' })
                .setLngLat([parseFloat(longitude), parseFloat(latitude)])
                .setPopup(new mapboxgl.Popup().setHTML(`
                    <h3>${name}</h3>
                    <p>Status: Closed</p>
                `))
                .addTo(map);
        }
    });

    // Update the building list in the sidebar
    Object.entries(buildingsData).forEach(([buildingName, rooms]) => {
        const buildingDiv = document.createElement('div');
        buildingDiv.className = 'building';
        buildingDiv.innerHTML = `
            <h3>${buildingName}</h3>
            <ul class="rooms">
                ${rooms.map(room => `<li>${room}</li>`).join('')}
            </ul>
        `;
        buildingList.appendChild(buildingDiv);
    });
    
}
