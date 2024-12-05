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

// str -> str
function mapRoomToBuilding(room) {

}

// Determine if a room is available
function isRoomAvailable(schedule, day, time) {
   const periods = schedule[day] || [];
   return periods.some(({ start, end }) => time >= start && time <= end);
}


// Add markers and populate the side panel with open rooms
function addMarkers(map, locations, schedules) {
   const now = new Date();
   const day = now.toLocaleString('en-US', { weekday: 'long' });
   const time = now.toTimeString().split(' ')[0]; // Current time in HH:MM:SS format


   const buildingList = document.getElementById('building-list');


   // Ensure sidebar is visible
   const panel = document.getElementById('panel');
   if (window.getComputedStyle(panel).display === 'none') {
       console.warn('Panel is hidden. Ensure it is visible in your CSS.');
   }


   console.log('Clearing and updating building list...');
   buildingList.innerHTML = ''; // Clear previous entries


   locations.forEach(location => {
       const { name, longitude, latitude } = location;
       let isBuildingOpen = false;
       const openRooms = [];


       // Check if any classroom in the building is open
       Object.entries(schedules).forEach(([room, schedule]) => {
            console.log(building)
           if (room.includes(name)) {
               const available = isRoomAvailable(schedule, day, time);
               if (available) {
                   isBuildingOpen = true;
                   openRooms.push(room);
               }
           }
       });


       // Only add to the side panel if the building has at least one open classroom
       if (isBuildingOpen) {
           // Add green marker for open buildings
           const color = 'green';
           new mapboxgl.Marker({ color })
               .setLngLat([parseFloat(longitude), parseFloat(latitude)])
               .setPopup(new mapboxgl.Popup().setHTML(`
                   <h3>${name}</h3>
                   <p>Status: Open</p>
                   <p>Open Rooms: ${openRooms.join(', ')}</p>
               `))
               .addTo(map);


           // Update the building list panel
           const div = document.createElement('div');
           div.className = 'building';
           div.innerHTML = `<h3>${name}</h3><p>Status: Open</p><p>Open Rooms: ${openRooms.join(', ')}</p>`;
           buildingList.appendChild(div);
       } else {
           // Add red marker for closed buildings
           const color = 'red';
           new mapboxgl.Marker({ color })
               .setLngLat([parseFloat(longitude), parseFloat(latitude)])
               .setPopup(new mapboxgl.Popup().setHTML(`
                   <h3>${name}</h3>
                   <p>Status: Closed</p>
               `))
               .addTo(map);
       }
   });


   console.log('Markers and sidebar updated successfully.');
}


// Load data and initialize markers
fetchData().then(({ schedules, locations }) => {
   if (!schedules || !locations) {
       console.error('Missing schedules or locations data.');
       document.getElementById('building-list').innerHTML = '<p>Error loading data. Please try again later.</p>';
       return;
   }
   addMarkers(map, locations, schedules);
}).catch(err => {
   console.error('Error loading data:', err);
   document.getElementById('building-list').innerHTML = '<p>Failed to load data. Please check the console for details.</p>';
});
