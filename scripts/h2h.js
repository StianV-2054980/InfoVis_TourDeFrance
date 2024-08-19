// Determine the base URL
var baseURL = window.location.hostname === 'localhost' ? '' : '/InfoVis_TourDeFrance';

// Construct the full URLs
var csvFilePathStages = baseURL + '/data/tdf_stages.csv';
var csvFilePathFinishers = baseURL + '/data/tdf_finishers.csv';

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
    document.getElementById(`rider${riderNbr}-results`).innerHTML = '';

    // Update chart
    const rider1 = getRiderData(1);
    const rider2 = getRiderData(2);
    createUpdatePositionChart('yearly-positions-chart', rider1, rider2);
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
                const startIndex = riders[i].toUpperCase().indexOf(val.toUpperCase());
                autoCompItem.innerHTML = riders[i].substr(0, startIndex) + "<strong>" + riders[i].substr(startIndex, val.length) + "</strong>" + riders[i].substr(startIndex + val.length);
                autoCompItem.innerHTML += '<input type="hidden" value="' + riders[i] + '">';
                autoCompItem.addEventListener('click', function() {
                    input.value = this.getElementsByTagName('input')[0].value;
                    closeAllLists();
                    fetchRiderInfo(input.value, input.id === 'rider1-search' ? 1 : 2);
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

function createUpdatePositionChart(elementId, rider1 = [], rider2 = []) {
    const data = [];
    if (rider1.length > 0) {
        const rider1Trace = {
            x: rider1.map((row, i) => i+1),
            y: rider1.map(row => row.Rank === 'DSQ' ? 0 : parseInt(row.Rank)),
            mode: 'lines+markers',
            name: rider1[0].Name,
            line: {color: '#D55E00'},
        };
        data.push(rider1Trace);
    }

    if (rider2.length > 0) {
        const rider2Trace = {
            x: rider2.map((row, i) => i+1),
            y: rider2.map(row => row.Rank === 'DSQ' ? 0 : parseInt(row.Rank)),
            mode: 'lines+markers',
            name: rider2[0].Name,
            line: {color: '#0072B2'}
        };
        data.push(rider2Trace);
    }

    const layout = {
        title: 'Yearly Positions by Participation',
        xaxis: {title: 'Participation Number'},
        yaxis: {title: 'Rank', autorange: 'reversed'},
        margin: {t: 50, b: 50, l: 50, r: 50},
    };
    Plotly.newPlot(elementId, data, layout);
}

// Function to fetch and show information about a rider
function fetchRiderInfo(rider, riderNumber) {
    fetchAndParseCSV(csvFilePathStages).then(stageData => {
        fetchAndParseCSV(csvFilePathFinishers).then(finisherData => {
            const riderStages = stageData.filter(row => row.Winner).filter(row => row.Winner.trim() === rider);
            const overallWins = finisherData.filter(row => row.Rider).filter(row => row.Rider.trim() === rider && row.Rank === '1').length;
            const stageWins = riderStages.length;
            const highestOverall = Math.min(...finisherData.filter(row => row.Rider).filter(row => row.Rider.trim() === rider).map(row => row.Rank === 'DSQ' ? Infinity : parseInt(row.Rank)));
            //const highestStage = Math.min(...riderStages.map(row => parseInt(row.StageRank)));
            const yearlyPositions = finisherData.filter(row => row.Rider).filter(row => row.Rider.trim() === rider).map(row => ({ Year: row.Year, Rank: row.Rank === 'DSQ' ? 'DSQ' : parseInt(row.Rank) }));

            console.log(`Rider: ${rider}`);
            console.log(`Overall Wins: ${overallWins}`);
            console.log(`Stage Wins: ${stageWins}`);
            console.log(`Highest Overall Position: ${highestOverall}`);
            //console.log(`Highest Stage Position: ${highestStagePosition}`);
            console.log(`Yearly Positions: ${JSON.stringify(yearlyPositions)}`);

            // Display the information in the respective card
            const riderCard = rider === document.getElementById("rider1-search").value ? "rider1-results" : "rider2-results";
            document.getElementById(riderCard).innerHTML = `
                <p><strong>Rider:</strong> ${rider}</p>
                <p><strong>Overall Wins:</strong> ${overallWins}</p>
                <p><strong>Stage Wins:</strong> ${stageWins}</p>
                <p><strong>Highest Overall Position:</strong> ${highestOverall}</p>
                <p><strong>Yearly Positions:</strong> ${yearlyPositions.map(d => `Year: ${d.Year}, Rank: ${d.Rank}`).join('<br>')}</p>
            `;

            // Update chart
            const rider1 = riderNumber === 1 ? yearlyPositions : getRiderData(1);
            const rider2 = riderNumber === 2 ? yearlyPositions : getRiderData(2);
            // Add rider names
            rider1.forEach(row => row.Name = rider);
            rider2.forEach(row => row.Name = rider);
            createUpdatePositionChart('yearly-positions-chart', rider1, rider2);
        });
    });
}

function getRiderData(riderNumber) {
    const riderCard = riderNumber === 1 ? "rider1-results" : "rider2-results";
    const riderInfo = document.getElementById(riderCard).innerHTML;
    if (!riderInfo) return [];

    const yearlyPositionsMatch = riderInfo.match(/Yearly Positions:\s*(.*)/);
    if (!yearlyPositionsMatch) return [];

    // Get rider name
    const riderMatch = riderInfo.match(/<p><strong>Rider:<\/strong> (.*)<\/p>/);
    if (!riderMatch) return [];
    
    const yearlyPositionsText = yearlyPositionsMatch[1];
    const riderName = riderMatch[1];
    return yearlyPositionsText.split('<br>').map(d => {
        const [year, rank] = d.split(', Rank: ');
        return { Year: parseInt(year.replace('Year: ', '')), Rank: rank === 'DSQ' ? 'DSQ' : parseInt(rank), Name: riderName };
    });
}

async function initPage() {
    const finisherData = await fetchAndParseCSV(csvFilePathFinishers);

    const riderSet = new Set(finisherData
        .filter(row => row.Rider)
        .map(row => row.Rider.trim()));
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