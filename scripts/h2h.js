// Determine the base URL
var baseURL = window.location.hostname === 'localhost' ? '' : '/InfoVis_TourDeFrance';

// Construct the full URLs
var csvFilePathStages = baseURL + '/data/tdf_stages.csv';
var csvFilePathFinishers = baseURL + '/data/tdf_finishers.csv';

var rider1Name = '';
var rider2Name = '';
let rider1Data = [];
let rider2Data = [];

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

// Function to reset the search inputs and results
function resetRider(riderNbr) {
    document.getElementById(`rider${riderNbr}-search`).value = '';

    // Reset the table
    document.getElementById(`rider${riderNbr}Name`).innerText = '';
    document.getElementById(`rider${riderNbr}Overall`).innerText = '';
    document.getElementById(`rider${riderNbr}Stages`).innerText = '';
    document.getElementById(`rider${riderNbr}Highest`).innerText = '';
    document.getElementById(`rider${riderNbr}Yearly`).innerHTML = '';

    if (riderNbr === 1) {
        rider1Name = '';
        rider1Data = [];
    } else {
        rider2Name = '';
        rider2Data = [];
    }

    createUpdatePositionChart('yearly-positions-chart', rider1Data, rider2Data);
}

// Function to add autocomplete to an input field
function autoComplete(input, riders) {
    let currentFocus;

    input.addEventListener('input', function() {
        let autoCompContainer, autoCompItem, i, val = this.value;
        closeAllLists();
        if (!val) return false;
        currentFocus = -1;
        autoCompContainer = document.createElement('div');
        autoCompContainer.setAttribute('id', this.id + '-autocomplete-list');
        autoCompContainer.setAttribute('class', 'autocomplete-items');
        this.parentNode.appendChild(autoCompContainer);
        for (i = 0; i < riders.length; i++) {
            if (riders[i].toUpperCase().includes(val.toUpperCase())) {
                autoCompItem = document.createElement('div');
                autoCompItem.setAttribute('class', 'autocomplete-item');
                const startIndex = riders[i].toUpperCase().indexOf(val.toUpperCase());
                autoCompItem.innerHTML = riders[i].substr(0, startIndex) + "<strong>" + riders[i].substr(startIndex, val.length) + "</strong>" + riders[i].substr(startIndex + val.length);
                autoCompItem.innerHTML += '<input type="hidden" value="' + riders[i] + '">';
                autoCompItem.addEventListener('click', function() {
                    input.value = this.getElementsByTagName('input')[0].value;
                    closeAllLists();
                    fetchAndShowRiderInfo(input.value, input.id === 'rider1-search' ? 1 : 2);
                });
                autoCompContainer.appendChild(autoCompItem);
            }
        }
    });

    input.addEventListener('keydown', function(e) {
        let autoCompList = document.getElementById(this.id + '-autocomplete-list');
        if (autoCompList) autoCompList = autoCompList.getElementsByTagName('div');
        if (e.keyCode == 40) {
            currentFocus++;
            addActive(autoCompList);
        } else if (e.keyCode == 38) {
            currentFocus--;
            addActive(autoCompList);
        } else if (e.keyCode == 13) {
            e.preventDefault();
            if (currentFocus > -1) {
                if (autoCompList) autoCompList[currentFocus].click();
            }
        }
    });

    function addActive(autoCompList) {
        if (!autoCompList) return false;
        removeActive(autoCompList);
        if (currentFocus >= autoCompList.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (autoCompList.length - 1);
        autoCompList[currentFocus].classList.add('autocomplete-active');
    }

    function removeActive(autoCompList) {
        for (let i = 0; i < autoCompList.length; i++) {
            autoCompList[i].classList.remove('autocomplete-active');
        }
    }

    function closeAllLists(elmnt) {
        let autoCompList = document.getElementsByClassName('autocomplete-items');
        for (let i = 0; i < autoCompList.length; i++) {
            if (elmnt != autoCompList[i] && elmnt != input) {
                autoCompList[i].parentNode.removeChild(autoCompList[i]);
            }
        }
    }

    document.addEventListener('click', function(e) {
        closeAllLists(e.target);
    });
}

function generateTicks(startYear, endYear) {
    const range = endYear - startYear;
    let step;

    if (range > 20) {
        step = 10;
    } else if (range > 10) {
        step = 5;
    } else {
        step = 1;
    }

    const ticks = [];
    for (let i = startYear; i <= endYear; i += step) {
        ticks.push(i);
    }
    return ticks;
}

function createUpdatePositionChart(elementId, rider1 = [], rider2 = [], startYear = 1903, endYear = 2022) {
    const data = [];
    if (rider1.length > 0) {
        const rider1Trace = {
            x: rider1.map(row => row.Year),
            y: rider1.map(row => row.Rank === 'DSQ' ? 0 : parseInt(row.Rank)),
            mode: 'markers',
            type: 'scatter',
            name: rider1Name,
            marker: {color: '#D55E00', size: 7},
            hovertemplate: "<b>Participation</b>: %{x}<br><b>Position</b>: %{y}"
        };
        data.push(rider1Trace);
    }

    if (rider2.length > 0) {
        const rider2Trace = {
            x: rider2.map(row => row.Year),
            y: rider2.map(row => row.Rank === 'DSQ' ? 0 : parseInt(row.Rank)),
            mode: 'markers',
            type: 'scatter',
            name: rider2Name,
            marker: {color: '#0072B2', size: 7},
            hovertemplate: "<b>Participation</b>: %{x}<br><b>Position</b>: %{y}"
        };
        data.push(rider2Trace);
    }

    const layout = {
        title: 'Yearly Positions',
        xaxis: {title: 'Year', tickvals: generateTicks(startYear, endYear)},
        yaxis: {title: 'Rank', autorange: 'reversed'},
        margin: {t: 50, b: 50, l: 50, r: 50},
    };
    Plotly.newPlot(elementId, data, layout);
}

// Function to fetch and show information about a rider
function fetchAndShowRiderInfo(rider, riderNumber) {
    const cleanedRider = rider.replace(/\[\w\]/g, '').trim();

    fetchAndParseCSV(csvFilePathStages).then(stageData => {
        fetchAndParseCSV(csvFilePathFinishers).then(finisherData => {
            const riderStages = stageData.filter(row => row.Winner).filter(row => row.Winner.replace(/\[\w\]/g, '').trim() === cleanedRider);
            const overallWins = finisherData.filter(row => row.Rider).filter(row => row.Rider.replace(/\[\w\]/g, '').trim() === cleanedRider && row.Rank === '1').length;
            const stageWins = riderStages.length;
            const highestOverall = Math.min(...finisherData.filter(row => row.Rider).filter(row => row.Rider.replace(/\[\w\]/g, '').trim() === cleanedRider).map(row => row.Rank === 'DSQ' ? Infinity : parseInt(row.Rank)));
            //const highestStage = Math.min(...riderStages.map(row => parseInt(row.StageRank)));
            const yearlyPositions = finisherData.filter(row => row.Rider).filter(row => row.Rider.replace(/\[\w\]/g, '').trim() === cleanedRider).map(row => ({ Year: row.Year, Rank: row.Rank === 'DSQ' || (row.Rider.includes('[a]') || row.Rider.includes('[b]')) ? 'DSQ' : parseInt(row.Rank) }));

            // Display the information in the table
            if (riderNumber === 1) {
                document.getElementById('rider1Name').innerText = cleanedRider;
                document.getElementById('rider1Overall').innerText = overallWins;
                document.getElementById('rider1Stages').innerText = stageWins;
                document.getElementById('rider1Highest').innerText = highestOverall;
                document.getElementById('rider1Yearly').innerHTML = yearlyPositions.map(row => `Year: ${row.Year}, Rank: ${row.Rank}`).join('<br>');
                rider1Name = cleanedRider;
                rider1Data = yearlyPositions;
            } else {
                document.getElementById('rider2Name').innerText = cleanedRider;
                document.getElementById('rider2Overall').innerText = overallWins;
                document.getElementById('rider2Stages').innerText = stageWins;
                document.getElementById('rider2Highest').innerText = highestOverall;
                document.getElementById('rider2Yearly').innerHTML = yearlyPositions.map(row => `Year: ${row.Year}, Rank: ${row.Rank}`).join('<br>');
                rider2Name = cleanedRider;
                rider2Data = yearlyPositions;
            }
            
            // Determine the start and end years
            const allYears = [...rider1Data.map(d => d.Year), ...rider2Data.map(d => d.Year)];
            const startYear = Math.min(...allYears);
            const endYear = Math.max(...allYears);
            createUpdatePositionChart('yearly-positions-chart', rider1Data, rider2Data, startYear, endYear);
        });
    });
}

async function initPage() {
    const finisherData = await fetchAndParseCSV(csvFilePathFinishers);

    const riderSet = new Set(finisherData
        .filter(row => row.Rider)
        .map(row => row.Rider.trim().replace(/\[\w\]/g, '')));
    const riders = Array.from(riderSet).sort();

    document.getElementById('reset-rider1-button').addEventListener('click', () => resetRider(1));
    document.getElementById('reset-rider2-button').addEventListener('click', () => resetRider(2));
    // Add autocomplete to the rider search input field
    autoComplete(document.getElementById('rider1-search'), riders);
    autoComplete(document.getElementById('rider2-search'), riders);

    // Update chart
    createUpdatePositionChart('yearly-positions-chart');
}

initPage();