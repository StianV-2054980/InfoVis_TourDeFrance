// Determine the base URL
var baseURL = window.location.hostname === 'localhost' ? '' : '/InfoVis_TourDeFrance';

// Construct the full URLs
var csvFilePathStages = baseURL + '/data/tdf_stages.csv';
var csvFilePathFinishers = baseURL + '/data/tdf_finishers.csv';

var rider1Name = '';
var rider2Name = '';
let rider1Data = [];
let rider2Data = [];
let rider1Stages = {};
let rider2Stages = {};

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

    // Reset the color
    document.getElementById(`rider${riderNbr}Overall`).classList.remove('table-success');
    document.getElementById(`rider${riderNbr}Stages`).classList.remove('table-success');
    document.getElementById(`rider${riderNbr}Highest`).classList.remove('table-success');

    // Reset the image
    document.getElementById(`rider${riderNbr}Image`).src = 'https://cdn.pixabay.com/photo/2012/04/18/00/07/silhouette-of-a-man-36181_1280.png';

    if (riderNbr === 1) {
        rider1Name = '';
        rider1Data = [];
        rider1Stages = {};
        sessionStorage.removeItem('rider1');
    } else {
        rider2Name = '';
        rider2Data = [];
        rider2Stages = {};
        sessionStorage.removeItem('rider2');
    }

    createUpdatePositionChart('yearly-positions-chart', rider1Data, rider2Data);
    createUpdateStageWinsChart('stage-wins-radar', rider1Stages, rider2Stages);
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

// Function to generate the correct amount of ticks for the x-axis
function generateTicks(start, end) {
    const range = end - start;
    let step;
    if (range > 20) {
        step = 10;
    } else if (range > 10) {
        step = 5;
    } else {
        step = 1;
    }

    const ticks = [];
    for (let i = start; i <= end; i += step) {
        ticks.push(i);
    }
    return ticks;
}

// Function to create or update the position chart
function createUpdatePositionChart(elementId, rider1 = [], rider2 = [], startYear = 1903, endYear = 2022, highestPosition = 1, lowestPosition = 200) {
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
        yaxis: {title: 'Rank', autorange: 'reversed', tickvals: generateTicks(highestPosition, lowestPosition)},
        margin: {t: 50, b: 50, l: 50, r: 50},
    };
    Plotly.newPlot(elementId, data, layout);
}

// Function to create or update the stage wins chart
function createUpdateStageWinsChart(elementId, rider1Stages = {}, rider2Stages = {}) {
    const maxStageWins = Math.max(
        ...Object.values(rider1Stages),
        ...Object.values(rider2Stages)
    );
    const data = [
        {
            type: 'scatterpolar',
            r: [rider1Stages.mountain, rider1Stages.hilly, rider1Stages.flat, rider1Stages.tt, rider1Stages.ttt],
            theta: ['Mountain', 'Hilly', 'Flat', 'Time Trial', 'Team Time Trial'],
            fill: 'toself',
            name: rider1Name,
            hovertemplate: 'Type: %{theta}<br>Wins: %{r}<extra></extra>'
        },
        {
            type: 'scatterpolar',
            r: [rider2Stages.mountain, rider2Stages.hilly, rider2Stages.flat, rider2Stages.tt, rider2Stages.ttt],
            theta: ['Mountain', 'Hilly', 'Flat', 'Time Trial', 'Team Time Trial'],
            fill: 'toself',
            name: rider2Name,
            hovertemplate: 'Type: %{theta}<br>Wins: %{r}<extra></extra>'
        }
    ];

    const layout = {
        title: 'Stage Wins per Type',
        polar: {
            radialaxis: {
                visible: true,
                range: [0, maxStageWins + 1],
                tickvals: Array.from({length: maxStageWins + 1}, (_, i) => i),
            }
        },
        showlegend: true
    };

    if (maxStageWins > 10) {
        layout.polar.radialaxis.tickvals = Array.from({length: Math.floor(maxStageWins / 5) + 1}, (_, i) => i * 5);
    }

    Plotly.newPlot(elementId, data, layout);
}

// Function to fetch the rider image
async function fetchRiderImage(rider) {
    const riderName = rider.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim().toLowerCase().replace(/\s+/g, '-').replace('č', 'c').replace('š', 's').replace('ž', 'z');
    const pcsUrl = `https://corsproxy.io/?url=https://www.procyclingstats.com/rider/${riderName}`;

    try {
        const response = await fetch(pcsUrl);
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const riderImgElement = doc.querySelector('.rdr-img-cont img');

        if (riderImgElement) {
            return `https://www.procyclingstats.com/${riderImgElement.getAttribute('src')}`;
        } else {
            return 'https://cdn.pixabay.com/photo/2012/04/18/00/07/silhouette-of-a-man-36181_1280.png';
        }
    } catch (error) {
        return 'https://cdn.pixabay.com/photo/2012/04/18/00/07/silhouette-of-a-man-36181_1280.png';
    }
}

// Function to display information in the table
function displayInformation(riderNumber, cleanedRider, overallWins, stageWins, highestOverall, yearlyPositions, stageWinYears) {
    document.getElementById(`rider${riderNumber}Name`).innerText = cleanedRider;
    document.getElementById(`rider${riderNumber}Overall`).innerText = overallWins;
    document.getElementById(`rider${riderNumber}Stages`).innerText = stageWins;
    document.getElementById(`rider${riderNumber}Highest`).innerText = highestOverall == Infinity ? 'DNF' : highestOverall;

    fetchRiderImage(cleanedRider).then((imageSrc) => {
        document.getElementById(`rider${riderNumber}Image`).src = imageSrc;
    });

    const yearRankMap = new Map();
    yearlyPositions.forEach(row => {
        yearRankMap.set(row.Year, row.Rank);
    });
    stageWinYears.forEach(year => { // Add stage win years to the map if they don't already exist
        if (!yearRankMap.has(year)) {
            yearRankMap.set(year, 'DNF');
        }
    });
    const combinedResults = Array.from(yearRankMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([year, rank]) => `Year: ${year}, Rank: ${rank}`)
        .join('<br>');

    document.getElementById(`rider${riderNumber}Yearly`).innerHTML = combinedResults;

    highlightBestStats();
}

// Function to highlight the best overall
function highlightBestOverall(rider1Overall, rider2Overall) {
    if (rider1Overall > rider2Overall) {
        document.getElementById('rider1Overall').classList.add('table-success');
        document.getElementById('rider2Overall').classList.remove('table-success');
    } else if (rider2Overall > rider1Overall) {
        document.getElementById('rider2Overall').classList.add('table-success');
        document.getElementById('rider1Overall').classList.remove('table-success');
    } else {
        document.getElementById('rider1Overall').classList.remove('table-success');
        document.getElementById('rider2Overall').classList.remove('table-success');
    }
}

// Function to highlight the best stages
function highlightBestStages(rider1Stages, rider2Stages) {
    if (rider1Stages > rider2Stages) {
        document.getElementById('rider1Stages').classList.add('table-success');
        document.getElementById('rider2Stages').classList.remove('table-success');
    } else if (rider2Stages > rider1Stages) {
        document.getElementById('rider2Stages').classList.add('table-success');
        document.getElementById('rider1Stages').classList.remove('table-success');
    } else {
        document.getElementById('rider1Stages').classList.remove('table-success');
        document.getElementById('rider2Stages').classList.remove('table-success');
    }
}

// Function to highlight the best highest position
function highlightHighest(rider1Highest, rider2Highest) {
    if (rider1Highest < rider2Highest) {
        document.getElementById('rider1Highest').classList.add('table-success');
        document.getElementById('rider2Highest').classList.remove('table-success');
    } else if (rider2Highest < rider1Highest) {
        document.getElementById('rider2Highest').classList.add('table-success');
        document.getElementById('rider1Highest').classList.remove('table-success');
    } else {
        document.getElementById('rider1Highest').classList.remove('table-success');
        document.getElementById('rider2Highest').classList.remove('table-success');
    }
}

// Function to highlight the best stats
function highlightBestStats() {
    const rider1Overall = parseInt(document.getElementById('rider1Overall').innerText);
    const rider2Overall = parseInt(document.getElementById('rider2Overall').innerText);
    const rider1Stages = parseInt(document.getElementById('rider1Stages').innerText);
    const rider2Stages = parseInt(document.getElementById('rider2Stages').innerText);
    const rider1Highest = document.getElementById('rider1Highest').innerText === 'DNF' || document.getElementById('rider1Highest').innerText === 'DSQ' ? Infinity : parseInt(document.getElementById('rider1Highest').innerText);
    const rider2Highest = document.getElementById('rider2Highest').innerText === 'DNF' || document.getElementById('rider2Highest').innerText === 'DSQ' ? Infinity : parseInt(document.getElementById('rider2Highest').innerText);

    highlightBestOverall(rider1Overall, rider2Overall);
    highlightBestStages(rider1Stages, rider2Stages);
    highlightHighest(rider1Highest, rider2Highest);
}

// Function to update the chart information
function updateChartInformation() {
    const allYears = [...rider1Data.map(d => d.Year), ...rider2Data.map(d => d.Year)];
    const startYear = Math.min(...allYears);
    const endYear = Math.max(...allYears);

    const highestPosition = Math.min(...[...rider1Data.map(d => d.Rank), ...rider2Data.map(d => d.Rank)]);
    const lowestPosition = Math.max(...[...rider1Data.map(d => d.Rank), ...rider2Data.map(d => d.Rank)]);
    createUpdatePositionChart('yearly-positions-chart', rider1Data, rider2Data, startYear, endYear, highestPosition, lowestPosition);
    createUpdateStageWinsChart('stage-wins-radar', rider1Stages, rider2Stages);
}

// Function to get the stage win types
function getStageWinsTypes(riderStages) {
    const stageTypes = ['Flat stage', 'Mountain stage', 'Hilly stage', 'Team time trial', 'Individual time trial', 'Unknown'];
    const stageCount = {};

    // Initialize stageCount
    stageTypes.forEach(type => {
        stageCount[type] = 0;
    });

    riderStages.forEach(row => {
        let stageType = row['Type'];

        // Check if stageType is defined
        if (!stageType) {
            return;
        }

        // Categorize Mountain time trial with Individual time trial
        if (stageType === 'Mountain time trial') {
            stageType = 'Individual time trial';
        }
        // Categorize Plain stage with cobblestones with Flat stage
        else if (stageType === 'Plain stage with cobblestones' || stageType === 'Flat cobblestone stage') {
            stageType = 'Flat stage';
        }
        // Rename Plain stage to Flat stage
        else if (stageType === 'Plain stage' || stageType === 'Flat' || stageType === 'Flat Stage') {
            stageType = 'Flat stage';
        }
        // Categorize Medium-mountain stage with Hilly stage
        else if (stageType === 'Hilly Stage' || stageType === 'Medium-mountain stage' || stageType === 'Medium mountain stage') {
            stageType = 'Hilly stage';
        }
        // Rename Stage with mountain(s) to Mountain stage
        else if (stageType === 'Stage with mountain(s)' || stageType === 'High mountain stage' || stageType === 'Mountain Stage (s)' || stageType === 'Mountain Stage' || stageType === 'Stage with mountains' || stageType === 'Stage with mountain') {
            stageType = 'Mountain stage';
        }
        else if (stageType !== 'Flat stage' && stageType !== 'Mountain stage' && stageType !== 'Hilly stage' && stageType !== 'Team time trial' && stageType !== 'Individual time trial') {
            stageType = 'Unknown';
        }

        if (stageTypes.includes(stageType)) {
            stageCount[stageType]++;
        }
    });

    return [stageCount['Mountain stage'], stageCount['Hilly stage'], stageCount['Flat stage'], stageCount['Individual time trial'], stageCount['Team time trial']];
}

// Function to fetch and show information about a rider
function fetchAndShowRiderInfo(rider, riderNumber) {
    const cleanedRider = rider.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();

    fetchAndParseCSV(csvFilePathStages).then(stageData => {
        fetchAndParseCSV(csvFilePathFinishers).then(finisherData => {
            const riderStages = stageData.filter(row => row.Winner).filter(row => row.Winner.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim() === cleanedRider);
            const overallWins = finisherData.filter(row => row.Rider).filter(row => row.Rider.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim() === cleanedRider && row.Rank === '1' && !((row.Rider.includes('[a]') || row.Rider.includes('[b]')))).length;
            const [mountainStages, hillyStages, flatStages, timeTrialStages, teamTimeTrialStages] = getStageWinsTypes(riderStages);
            const stageWins = riderStages.length;
            const stageWinYears = riderStages.map(row => row.Year);
            const highestOverall = Math.min(...finisherData.filter(row => row.Rider).filter(row => row.Rider.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim() === cleanedRider).map(row => row.Rank === 'DSQ' || (row.Rider.includes('[a]') || row.Rider.includes('[b]')) ? 500 : parseInt(row.Rank)));
            //const highestStage = Math.min(...riderStages.map(row => parseInt(row.StageRank)));
            const yearlyPositions = finisherData.filter(row => row.Rider).filter(row => row.Rider.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim() === cleanedRider).map(row => ({ Year: row.Year, Rank: row.Rank === 'DSQ' || (row.Rider.includes('[a]') || row.Rider.includes('[b]')) ? 'DSQ' : parseInt(row.Rank) }));

            // Display the information in the table
            displayInformation(riderNumber, cleanedRider, overallWins, stageWins, highestOverall, yearlyPositions, stageWinYears);

            // Save rider information
            if (riderNumber === 1) {
                rider1Name = cleanedRider;
                rider1Data = yearlyPositions;
                rider1Stages = {mountain: mountainStages, hilly: hillyStages, flat: flatStages, tt: timeTrialStages, ttt: teamTimeTrialStages};
                sessionStorage.setItem('rider1', cleanedRider);
            } else {
                rider2Name = cleanedRider;
                rider2Data = yearlyPositions;
                rider2Stages = {mountain: mountainStages, hilly: hillyStages, flat: flatStages, tt: timeTrialStages, ttt: teamTimeTrialStages};
                sessionStorage.setItem('rider2', cleanedRider);
            }
            
            updateChartInformation();
        });
    });
}

async function initPage() {
    const finisherData = await fetchAndParseCSV(csvFilePathFinishers);
    const stageData = await fetchAndParseCSV(csvFilePathStages);

    const riderSet = new Set([
        ...finisherData.filter(row => row.Rider).map(row => row.Rider.trim().replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '')),
        ...stageData.filter(row => row.Winner).map(row => row.Winner.trim().replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, ''))
    ]);
    const riders = Array.from(riderSet).sort();

    document.getElementById('reset-rider1-button').addEventListener('click', () => resetRider(1));
    document.getElementById('reset-rider2-button').addEventListener('click', () => resetRider(2));
    // Add autocomplete to the rider search input field
    autoComplete(document.getElementById('rider1-search'), riders);
    autoComplete(document.getElementById('rider2-search'), riders);

    // Update chart
    createUpdatePositionChart('yearly-positions-chart');

    // When there are riders saved in session storage, fetch and show the information
    const rider1 = sessionStorage.getItem('rider1');
    const rider2 = sessionStorage.getItem('rider2');
    if (rider1) {
        document.getElementById('rider1-search').value = rider1;
        fetchAndShowRiderInfo(rider1, 1);
    }
    if (rider2) {
        document.getElementById('rider2-search').value = rider2;
        fetchAndShowRiderInfo(rider2, 2);
    }
}

initPage();