// This file contains all the JavaScript logic to initialize and interact with the map.
//It interacts with the Mapbox API, creates map layers, adds markers, and handles interactivity.
// Mapbox Access Token
mapboxgl.accessToken =
  "pk.eyJ1Ijoic2lhc2FtYSIsImEiOiJjbTN5dzV2a2cxN2hvMmpvZnVmYTIyenc5In0.7ZYRDMdIOyZbDGLT9UL2pA";


// Initialize the map
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/siasama/cm3yuzs0000iv01qqgsaogtzl",
  center: [-122.2595, 37.8721], // UC Berkeley center
  zoom: 15,
});


// Define the bounding box for UC Berkeley
const bounds = [
  [-122.275, 37.865], // Southwest corner
  [-122.25, 37.88], // Northeast corner
];
map.setMaxBounds(bounds);


// Fetch data from files
async function fetchData() {
  try {
    const dataResponse = await fetch("final_cleaned_data.json");
    const data = await dataResponse.json();


    console.log("Data fetched successfully:", { data });
    return data;
  } catch (err) {
    console.error("Error fetching data:", err);
    return { schedules: null, locations: null }; // Return empty values on error
  }
}


// Determine if a room is available
function isRoomAvailable(schedule, day, time) {
  const periods = schedule[day] || [];
  return periods.some(({ start, end }) => time >= start && time <= end);
}


function addMarkers(map, data) {
  const now = new Date();
  const day = now.toLocaleString("en-US", { weekday: "long" });
  const time = now.toTimeString().split(" ")[0]; // Current time in HH:MM:SS format


  const buildingList = document.getElementById("building-list");


  console.log("Clearing and updating building list...");
  buildingList.innerHTML = ""; // Clear previous entries


  for (const buildingName in data) {
    const building = data[buildingName];
    if (buildingName === "Unmapped") {
      continue; // Skip unmapped buildings
    }


    const { longitude, latitude, classrooms } = building;
    let openRooms = [];


    // Check for available classrooms in the building
    for (const classroomName in classrooms) {
      const schedule = classrooms[classroomName];
      const available = isRoomAvailable(schedule, day, time);
      if (available) {
        openRooms.push(classroomName);
      }
    }


    // Determine marker color: green for open, red for closed
    const markerColor = openRooms.length > 0 ? "green" : "red";


    // Add marker to the map
    new mapboxgl.Marker({ color: markerColor })
      .setLngLat([parseFloat(longitude), parseFloat(latitude)])
      .setPopup(
        new mapboxgl.Popup().setHTML(`
          <h3>${buildingName}</h3>
          ${
            openRooms.length > 0
              ? `<p>Open Rooms: ${openRooms.join(", ")}</p>`
              : `<p>No open rooms available</p>`
          }
        `)
      )
      .addTo(map);


    // Only show buildings with open rooms in the sidebar
    if (openRooms.length === 0) {
      continue;
    }


    // Create a collapsible dropdown for the building
    const buildingDiv = document.createElement("div");
    buildingDiv.className = "building";


    // Create the clickable header for the building
    const header = document.createElement("div");
    header.className = "building-header";
    header.innerHTML = `<h3>${buildingName}</h3>`;
    buildingDiv.appendChild(header);


    // Create the dropdown section to list open rooms
    const dropdown = document.createElement("div");
    dropdown.className = "building-dropdown";
    dropdown.style.display = "none"; // Initially hidden
    dropdown.innerHTML = `<p>Open Rooms: ${openRooms.join(", ")}</p>`;
    buildingDiv.appendChild(dropdown);


    // Add click event to toggle dropdown visibility
    header.addEventListener("click", () => {
      dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
    });


    // Append the building information to the sidebar
    buildingList.appendChild(buildingDiv);
  }
  console.log("Markers and sidebar updated successfully.");
}


// Load data and initialize markers
fetchData()
  .then((data) => {
    if (!data) {
      console.error("Missing schedules or locations data.");
      document.getElementById("building-list").innerHTML =
        "<p>Error loading data. Please try again later.</p>";
      return;
    }
    addMarkers(map, data);
  })
  .catch((err) => {
    console.error("Error loading data:", err);
    document.getElementById("building-list").innerHTML =
      "<p>Failed to load data. Please check the console for details.</p>";
  });
