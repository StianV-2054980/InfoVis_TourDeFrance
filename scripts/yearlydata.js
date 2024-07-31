// Path to CSV file
var csvFilePathWinners = '../data/tdf_winners.csv';
var csvFilePathTours = '../data/tdf_tours.csv';

// Function to fetch and parce CSV
async function fetchAndParseCSV(csvFilePath) {
    const response = await fetch(csvFilePath);
    const csvText = await response.text();

    return new Promise((resolve) => {
        Papa.parse(csvText, {
            header: true,
            complete: function(results) {
                resolve(results.data);
            }
        });
    });
}

// Cleans distance format
function cleanDistance(distance) {
    if (!distance) return 'N/A';

    return distance.split('(')[0].trim();
}

// Function to update yearly information
function updateInfo(year, tourData, winnerData) {
    const winnerInfo = winnerData.find(row => row.Year == year) || {};
    const tourInfo = tourData.find(row => row.Year == year) || {};

    document.getElementById('year').textContent = year;
    document.getElementById('winner').textContent = winnerInfo.Rider || 'N/A';
    document.getElementById('time').textContent = winnerInfo.Time || 'N/A';
    document.getElementById('distance').textContent = cleanDistance(tourInfo.Distance);
    document.getElementById('stages').textContent = tourInfo.Stages || 'N/A';
    document.getElementById('speed').textContent = winnerInfo['Avg Speed'] || 'N/A';
}

// Init page
async function initPage() {
    const tourData = await fetchAndParseCSV(csvFilePathTours);
    const winnerData = await fetchAndParseCSV(csvFilePathWinners);

    const yearSelector = document.getElementById('yearSelector');
    const prevYearButton = document.getElementById('prevYear');
    const nextYearButton = document.getElementById('nextYear');
    let currentYear = 2022; // Last year in the dataset
    const minYear = 1903; // First year in the dataset
    const maxYear = 2022; // Last year in the dataset

    const riddenYears = tourData.map(row => parseInt(row.Year));
    // Add year options to selector
    for (let year = maxYear; year >= minYear; year--) {
        if (riddenYears.includes(year)) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelector.appendChild(option);
        }
    }

    // Set initial year
    updateInfo(currentYear, tourData, winnerData);

    // Disable button by default
    nextYearButton.disabled = true;

    // Add event listeners
    yearSelector.addEventListener('change', function() {
        currentYear = parseInt(this.value);
        updateInfo(currentYear, tourData, winnerData);
        nextYearButton.disabled = currentYear === maxYear;
        prevYearButton.disabled = currentYear === minYear;
    });

    prevYearButton.addEventListener('click', function() {
        if (currentYear > minYear) {
            prevYearButton.disabled = false;
            currentYear--;
            while (!riddenYears.includes(currentYear) && currentYear > minYear) {
                currentYear--;
            }
            yearSelector.value = currentYear;
            updateInfo(currentYear, tourData, winnerData);
        }
        nextYearButton.disabled = false;
        prevYearButton.disabled = currentYear === minYear;
    });

    nextYearButton.addEventListener('click', function() {
        if (currentYear < maxYear) {
            nextYearButton.disabled = false;
            currentYear++;
            while (!riddenYears.includes(currentYear) && currentYear < maxYear) {
                currentYear++;
            }
            yearSelector.value = currentYear;
            updateInfo(currentYear, tourData, winnerData);
        }
        prevYearButton.disabled = false;
        nextYearButton.disabled = currentYear === maxYear;
    });
}

initPage();