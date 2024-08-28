// Determine the base URL
var baseURL = window.location.hostname === 'localhost' ? '' : '/InfoVis_TourDeFrance';

// Construct the full URLs
var csvFilePathWinners = baseURL + '/data/tdf_winners.csv';
var csvFilePathTours = baseURL + '/data/tdf_tours.csv';
var csvFilePathStages = baseURL + '/data/tdf_stages.csv';

// From https://www.kaggle.com/datasets/pablomonleon/tour-de-france-historic-stages-data
var csvFilePathStageResults = baseURL + '/data/stage_data.csv';

let fullstageResultsList = [];

// Event listeners for the modal
document.getElementById('riderResultSearch').addEventListener('input', function() {
    filterResults();
});

document.getElementById('teamFilters').addEventListener('change', function() {
    filterResults();
});

// Get teams
function getTeams() {
    const checkboxes = document.querySelectorAll('#teamFilters input[type="checkbox"]');
    const teams = [];
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            teams.push(checkbox.value);
        }
    });
    return teams;
}

// Filter results
function filterResults() {
    const search = document.getElementById('riderResultSearch').value.toLowerCase();
    const teams = getTeams();
    const stageResultsList = document.getElementById('resultsList');
    const filteredResults = fullstageResultsList.filter(result => {
        const riderMatches = result.rider.toLowerCase().includes(search);
        const teamMatches = teams.length === 0 || teams.includes(result.team);
        return riderMatches && teamMatches;
    });

    stageResultsList.innerHTML = '';
    if (filteredResults.length > 0) {
        populateResultsList(filteredResults, stageResultsList);
        document.getElementById('emptyState').style.display = 'none';
    } else {
        document.getElementById('emptyState').style.display = 'block';
    }
}

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
async function updateInfo(year, tourData, winnerData, stagesData, stageResultsData) {
    const winnerInfo = winnerData.find(row => row.Year == year) || {};
    const tourInfo = tourData.find(row => row.Year == year) || {};

    let winnerText = winnerInfo.Rider || 'N/A';
    let flagIcon = getFlag(winnerInfo.Country);

    // Special case for years 1998 to 2006
    if (year > 1998 && year < 2006) {
        winnerText = '<s>Lance Armstrong</s>';
        flagIcon = getFlag('USA');
    }

    document.getElementById('year').textContent = year;
    document.getElementById('winner').innerHTML = `${winnerText} ${flagIcon}` || 'N/A';
    document.getElementById('time').textContent = winnerInfo.Time || 'N/A';
    document.getElementById('distance').textContent = cleanDistance(tourInfo.Distance);
    document.getElementById('stages').textContent = tourInfo.Stages || 'N/A';
    document.getElementById('speed').textContent = winnerInfo['Avg Speed'] || 'N/A';
    
    updateStagesList(year, stagesData, stageResultsData);
    await updateMap(year, stagesData);
}

// Populate results list
function populateResultsList(fullstageResults, stageResultsList) {
    for (const result of fullstageResults) {
        const resultItem = document.createElement('li');
        resultItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
        fullItem = resultItem.appendChild(document.createElement('div'));
        fullItem.classList.add('ms-2', 'me-auto');

        const positionItem = fullItem.appendChild(document.createElement('div'));
        positionItem.classList.add('fw-bold');
        positionItem.textContent = `${result.rank}.`;

        const riderItem = fullItem.appendChild(document.createElement('div'));
        riderItem.classList.add('fw-bold');
        riderItem.textContent = result.rider;
        
        const teamItem = fullItem.appendChild(document.createElement('div'));
        teamItem.classList.add('mt-1');
        teamItem.textContent = result.team;

        stageResultsList.appendChild(resultItem);
    }
}

// Generate team filter
function generateTeamFilter(fullstageResults) {
    const teamFilter = document.getElementById('teamFilters');
    teamFilter.innerHTML = '';

    const teams = [...new Set(fullstageResults.map(result => result.team))];
    teams.sort();

    if (teams.length === 1 && teams[0] === '') {
        teamFilter.style.display = 'none';
        return;
    }

    teams.forEach(team => {
        const formCheck = document.createElement('div');
        formCheck.classList.add('form-check');

        const checkbox = document.createElement('input');
        checkbox.classList.add('form-check-input');
        checkbox.type = 'checkbox';
        checkbox.value = team;
        checkbox.id = `team-${team}`;

        const label = document.createElement('label');
        label.classList.add('form-check-label');
        label.htmlFor = `team-${team}`;
        label.textContent = team;

        formCheck.appendChild(checkbox);
        formCheck.appendChild(label);
        teamFilters.appendChild(formCheck);
    });
}

// Show results
function showResults(stage, stageResults, divItem) {
    resultsItem = divItem.appendChild(document.createElement('button'));
    resultsItem.classList.add('btn', 'btn-dark', 'btn-sm', 'mt-1');
    resultsItem.id = stage.Stage === 'P' ? `stage-0` : `stage-${stage.Stage}`;
    resultsItem.textContent = 'Full stage results';
    resultsItem.addEventListener('click', async function() {
        const stageTitle = document.getElementById('resultsModalLabel');
        stageTitle.textContent = `Stage ${stage.Stage} results`;
        const stageResultsList = document.getElementById('resultsList');
        
        // Get the results for the stage, by the id of the button that was pressed
        var fullstageResults = stageResults.filter(row => row.stage_results_id == this.id);
        fullstageResultsList = fullstageResults;
        // Populate the modal list
        stageResultsList.innerHTML = '';
        populateResultsList(fullstageResults, stageResultsList);

        generateTeamFilter(fullstageResults);

        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('resultsModal'));
        modal.show();
    });
}

// Parses the winner
function parseWinner(winner) {
    let country = '';
    let isDisqualified = false;
    if (winner.includes('(')) {
        const parts = winner.split('(');
        winner = parts[0].trim();
        country = parts[1].replace(')', '');
    }
    if (country.includes('[a]')) {
        country = country.replace('[a]', '').trim();
        isDisqualified = true;
    }

    return { winner, country, isDisqualified };
}

// Creates the course item
function createCourseItem(divItem, stage) {
    courseItem = divItem.appendChild(document.createElement('div'));
    courseItem.classList.add('fw-bold');
    stage.Course = stage.Course.replace(/\[.*?\]/g, '');
    courseItem.textContent = stage.Course;
}

// Creates the winner item
function createWinnerItem(divItem, winner, country, isDisqualified) {
    winnerItem = divItem.appendChild(document.createElement('div'));
    let flagIcon = getFlag(country, true);

    if (isDisqualified) {
        scrappedItem = winnerItem.appendChild(document.createElement('s'));
        scrappedItem.textContent = 'Winner: ' + winner;
    } else {
        winnerItem.textContent = 'Winner: ' + winner + ' ';
    }

    flagItem = winnerItem.appendChild(document.createElement('span'));
    flagItem.classList.add('fi', `fi-${flagIcon}`);
}

// Update stages list
function updateStagesList(year, stagesData, stageResultsData) {
    const stages = stagesData.filter(row => row.Year == year);
    const stageResults = stageResultsData.filter(row => row.year == year);
    const stagesList = document.getElementById('stagesList');
    stagesList.innerHTML = '';

    for (const stage of stages) {
        const stageItem = document.createElement('li');
        stageItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');

        divItem = stageItem.appendChild(document.createElement('div'));
        divItem.classList.add('ms-2', 'me-auto');

        createCourseItem(divItem, stage);

        let { winner, country, isDisqualified } = parseWinner(stage.Winner || 'N/A');
        createWinnerItem(divItem, winner, country, isDisqualified);

        // Only do this if year is before 2020
        if (year < 2020) {
            showResults(stage, stageResults, divItem);
        }

        stagesList.appendChild(stageItem);
    }
}

// Init page
async function initPage() {
    const tourData = await fetchAndParseCSV(csvFilePathTours);
    const winnerData = await fetchAndParseCSV(csvFilePathWinners);
    const stagesData = await fetchAndParseCSV(csvFilePathStages);
    const stageResultsData = await fetchAndParseCSV(csvFilePathStageResults);

    const yearSelector = document.getElementById('yearSelector');
    const prevYearButton = document.getElementById('prevYear');
    const nextYearButton = document.getElementById('nextYear');

    // Init currentYear to sessionStorage if available
    let currentYear;
    if (sessionStorage.getItem('year')) {
        currentYear = parseInt(sessionStorage.getItem('year'));
    } else {
        currentYear = 2022; // Last year in the dataset
    }

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
    yearSelector.value = currentYear;
    await updateInfo(currentYear, tourData, winnerData, stagesData, stageResultsData);

    // Disable button by default
    if(currentYear === minYear) prevYearButton.disabled = true;
    if(currentYear === maxYear) nextYearButton.disabled = true;

    // Add event listeners
    yearSelector.addEventListener('change', function() {
        currentYear = parseInt(this.value);
        yearSelector.value = currentYear;
        updateInfo(currentYear, tourData, winnerData, stagesData, stageResultsData);
        nextYearButton.disabled = currentYear === maxYear;
        prevYearButton.disabled = currentYear === minYear;
        sessionStorage.setItem('year', currentYear);
    });

    prevYearButton.addEventListener('click', function() {
        if (currentYear > minYear) {
            prevYearButton.disabled = false;
            currentYear--;
            while (!riddenYears.includes(currentYear) && currentYear > minYear) {
                currentYear--;
            }
            yearSelector.value = currentYear;
            updateInfo(currentYear, tourData, winnerData, stagesData, stageResultsData);
            sessionStorage.setItem('year', currentYear);
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
            updateInfo(currentYear, tourData, winnerData, stagesData, stageResultsData);
            sessionStorage.setItem('year', currentYear);
        }
        prevYearButton.disabled = false;
        nextYearButton.disabled = currentYear === maxYear;
    });
}

initPage();