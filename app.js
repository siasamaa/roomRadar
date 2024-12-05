// This file contains all the JavaScript logic to initialize and interact with the map.
//It interacts with the Mapbox API, creates map layers, adds markers, and handles interactivity.
// Mapbox Access Token
mapboxgl.accessToken =
  "pk.eyJ1Ijoic2lhc2FtYSIsImEiOiJjbTN5dzV2a2cxN2hvMmpvZnVmYTIyenc5In0.7ZYRDMdIOyZbDGLT9UL2pA";

// Initialize the map
const map = new mapboxgl.Map({
   container: 'map',
   style: 'mapbox://styles/siasama/cm3yuzs0000iv01qqgsaogtzl',
   center: [-122.2595, 37.8721], // UC Berkeley center
   zoom: 15,
   pitch: 75
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

// Add markers and populate the side panel with open rooms
function addMarkers(map, data) {
  const now = new Date();
  const day = now.toLocaleString("en-US", { weekday: "long" });
  const time = now.toTimeString().split(" ")[0]; // Current time in HH:MM:SS format

  const buildingList = document.getElementById("building-list");

  // Ensure sidebar is visible
  const panel = document.getElementById("panel");
  if (window.getComputedStyle(panel).display === "none") {
    console.warn("Panel is hidden. Ensure it is visible in your CSS.");
  }

  console.log("Clearing and updating building list...");
  buildingList.innerHTML = ""; // Clear previous entries

  for (const buildingName in data) {
    const building = data[buildingName];
    if (buildingName == "Unmapped") {
      continue;
    }
    const { longitude, latitude, classrooms } = building;
    let isBuildingOpen = false;
    let openRooms = [];
    for (const classroomName in classrooms) {
      const schedule = classrooms[classroomName];
      const available = isRoomAvailable(schedule, day, time);
      if (available) {
        isBuildingOpen = true;
        openRooms.push(classroomName);
      }
    }
    // Only add to the side panel if the building has at least one open classroom
    if (isBuildingOpen) {
      // Add green marker for open buildings
      const color = "green";
      new mapboxgl.Marker({ color })
        .setLngLat([parseFloat(longitude), parseFloat(latitude)])
        .setPopup(
          new mapboxgl.Popup().setHTML(`
            <h3>${buildingName}</h3>
            <p>Status: Open</p>
            <p>Open Rooms: ${openRooms.join(", ")}</p>
        `),
        )
        .addTo(map);

      // Update the building list panel
      const div = document.createElement("div");
      div.className = "building";
      div.innerHTML = `<h3>${buildingName}</h3><p>Status: Open</p><p>Open Rooms: ${openRooms.join(", ")}</p>`;
      buildingList.appendChild(div);
    } else {
      // Add red marker for closed buildings
      const color = "red";
      new mapboxgl.Marker({ color })
        .setLngLat([parseFloat(longitude), parseFloat(latitude)])
        .setPopup(
          new mapboxgl.Popup().setHTML(`
                <h3>${buildingName}</h3>
                <p>Status: Closed</p>
            `),
        )
        .addTo(map);
    }
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
