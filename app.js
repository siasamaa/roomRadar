// Mapbox Access Token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2lhc2FtYSIsImEiOiJjbTNudDFicTYweG9hMmlweXFrb25jcmNpIn0.1GVEpiSmU0b8wWSOm8FdIQ'
// Initialize the map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/siasama/cm3yuzs0000iv01qqgsaogtzl',
    center: [-122.2595, 37.8721],
    zoom: 15
});

// Define map bounds
const bounds = [
    [-122.2750, 37.8650], // Southwest corner
    [-122.2500, 37.8800]  // Northeast corner
];
map.setMaxBounds(bounds);

// Ensure the map stays within bounds
map.on('dragend', () => {
    if (!map.getBounds().contains(map.getCenter())) {
        map.setCenter(map.getBounds().getCenter());
    }
});

// Load data and add markers
async function loadData() {
    const schedules = await fetch('schedules.json').then(res => res.json());
    const locations = await fetch('locations.json').then(res => res.json());

    addMarkers(map, schedules, locations);
}

// Determine if a building is open
function isOpen(schedule, day, currentTime) {
    if (!schedule[day]) return false;
    return schedule[day].some(({ start, end }) => {
        const startTime = new Date(`1970-01-01T${start}Z`);
        const endTime = new Date(`1970-01-01T${end}Z`);
        return currentTime >= startTime && currentTime <= endTime;
    });
}

// Add markers to the map
function addMarkers(map, schedules, locations) {
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = new Date(`1970-01-01T${now.toTimeString().split(' ')[0]}Z`);

    locations.forEach(building => {
        const schedule = schedules[building.name];
        const open = schedule ? isOpen(schedule, day, currentTime) : false;

        const el = document.createElement('div');
        el.className = 'marker';
        el.style.width = '12px';
        el.style.height = '12px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = open ? 'green' : 'gray';

        new mapboxgl.Marker(el)
            .setLngLat([parseFloat(building.longitude), parseFloat(building.latitude)])
            .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                    .setHTML(`<h3>${building.name}</h3><p>Status: ${open ? 'Open' : 'Closed'}</p>`)
            )
            .addTo(map);
    });
}

// Load data when map is ready
map.on('load', loadData);
