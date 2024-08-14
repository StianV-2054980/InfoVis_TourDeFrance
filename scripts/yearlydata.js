// Determine the base URL
var baseURL = window.location.hostname === 'localhost' ? '' : '/InfoVis_TourDeFrance';

// Construct the full URLs
var csvFilePathWinners = baseURL + '/data/tdf_winners.csv';
var csvFilePathTours = baseURL + '/data/tdf_tours.csv';
var csvFilePathStages = baseURL + '/data/tdf_stages.csv';

// From https://www.kaggle.com/datasets/pablomonleon/tour-de-france-historic-stages-data
var csvFilePathStageResults = baseURL + '/data/tdf_stage_results.csv';

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

// Short country names to flag-icon-css classes
const shortCountryFlagMap = {
    'FRA' : 'fr',
    'SLO' : 'si',
    'LUX' : 'lu',
    'BEL' : 'be',
    'DEN' : 'dk',
    'CHE' : 'ch',
    'ITA' : 'it',
    'NED' : 'nl',
    'ESP' : 'es',
    'IRL' : 'ie',
    'USA' : 'us',
    'AUS' : 'au',
    'GER' : 'de',
    'GBR' : 'gb',
    'GB' : 'gb',
    'UKR' : 'ua',
    'COL' : 'co',
    'SVN' : 'si',
    'ECU' : 'ec',
    'SVK' : 'sk',
    'NOR' : 'no',
    'RUS' : 'ru',
    'SWE' : 'se',
    'PRT' : 'pt',
    'CZE' : 'cz',
    'KAZ' : 'kz',
    'AUT' : 'at',
    'NZL' : 'nz',
    'ZAF' : 'za',
    'POL' : 'pl',
    'CAN' : 'ca',
    'EST' : 'ee',
    'LVA' : 'lv',
    'LTU' : 'lt',
    'SUI' : 'ch',
    'IRE' : 'ie',
};

// Mapping of country names to flag-icon-css classes
const countryFlagMap = {
    'France': 'fr',
    'Luxembourg': 'lu',
    'Belgium': 'be',
    'Denmark': 'dk',
    'Switzerland': 'ch',
    'Italy': 'it',
    'Netherlands': 'nl',
    'Spain': 'es',
    'Ireland': 'ie',
    'United States': 'us',
    'Australia': 'au',
    'Germany': 'de',
    'United Kingdom': 'gb',
    'Great Britain': 'gb',
    'Ukraine': 'ua',
    'Colombia': 'co',
    'Slovenia': 'si',
    'Ecuador': 'ec',
    'Slovakia': 'sk',
    'Norway': 'no',
    'Luxembourg': 'lu',
    'Russia': 'ru',
    'Sweden': 'se',
    'Portugal': 'pt',
    'Czech Republic': 'cz',
    'Kazakhstan': 'kz',
    'Austria': 'at',
    'New Zealand': 'nz',
    'South Africa': 'za',
    'Poland': 'pl',
    'Canada': 'ca',
    'Estonia': 'ee',
    'Latvia': 'lv',
    'Lithuania': 'lt',
    'USA': 'us',
};

function getFlag(country, short = false) {
    if (short) {
        var flagClass = shortCountryFlagMap[country] || '';
        return flagClass;
    }
    var flagClass = countryFlagMap[country] || '';
    return '<span class="fi fi-' + flagClass + '"></span>';
}

// Cleans distance format
function cleanDistance(distance) {
    if (!distance) return 'N/A';
    return distance.split('(')[0].trim();
}

// Function to update yearly information
async function updateInfo(year, tourData, winnerData, stagesData) {
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
    
    updateStagesList(year, stagesData);
    await updateMap(year, stagesData);
}

// Update stages list
function updateStagesList(year, stagesData) {
    const stages = stagesData.filter(row => row.Year == year);
    const stagesList = document.getElementById('stagesList');
    stagesList.innerHTML = '';

    for (const stage of stages) {
        const stageItem = document.createElement('li');
        stageItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');

        divItem = stageItem.appendChild(document.createElement('div'));
        divItem.classList.add('ms-2', 'me-auto');

        courseItem = divItem.appendChild(document.createElement('div'));
        courseItem.classList.add('fw-bold');
        stage.Course = stage.Course.replace(/\[.*?\]/g, '');
        courseItem.textContent = stage.Course;

        winnerItem = divItem.appendChild(document.createElement('div'));
        
        let winner = stage.Winner || 'N/A';
        // Cut away the parentheses, and remember the country inside the parentheses
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
        let flagIcon = getFlag(country, true);

        if (isDisqualified) {
            scrappedItem = winnerItem.appendChild(document.createElement('s'));
            scrappedItem.textContent = 'Winner: ' + winner;
        } else {
            winnerItem.textContent = 'Winner: ' + winner + ' ';
        }
        flagItem = winnerItem.appendChild(document.createElement('span'));
        flagItem.classList.add('fi', `fi-${flagIcon}`);

        // Only do this if year is before 2020
        if (year < 2020) {
            resultsItem = divItem.appendChild(document.createElement('button'));
            resultsItem.classList.add('btn', 'btn-primary', 'btn-sm');
            resultsItem.textContent = 'Full stage results';
            resultsItem.addEventListener('click', async function() {
                // Open modal and show full results per stage
            });
        }
        stagesList.appendChild(stageItem);
    }
}

// Init page
async function initPage() {
    const tourData = await fetchAndParseCSV(csvFilePathTours);
    const winnerData = await fetchAndParseCSV(csvFilePathWinners);
    const stagesData = await fetchAndParseCSV(csvFilePathStages);

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
    await updateInfo(currentYear, tourData, winnerData, stagesData);

    // Disable button by default
    nextYearButton.disabled = true;

    // Add event listeners
    yearSelector.addEventListener('change', function() {
        currentYear = parseInt(this.value);
        updateInfo(currentYear, tourData, winnerData, stagesData);
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
            updateInfo(currentYear, tourData, winnerData, stagesData);
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
            updateInfo(currentYear, tourData, winnerData, stagesData);
        }
        prevYearButton.disabled = false;
        nextYearButton.disabled = currentYear === maxYear;
    });
}

initPage();