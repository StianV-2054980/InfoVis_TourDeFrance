// Path to CSV file
const csvFilePathTours = '../data/tdf_tours.csv';
const csvFilePathWinners = '../data/tdf_winners.csv';
const csvFilePathStages = '../data/tdf_stages.csv';

var yearIndexMapDistance = {};
var yearIndexMapSpeed = {};
var yearIndexMapStages = {};
var yearIndexMapStartersFinishers = {};

// Function to fetch and parse CSV file
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

// Function to process data and create the chart
function createDistanceChart(data) {
    const yearKmMap = {};

    data.forEach(row => {
        const year = row['Year'];
        const distance = row['Distance'];

        if (year && distance) {
            const distanceValue = parseFloat(distance.replace(/,| km/g, ''));
            if (!isNaN(distanceValue)) {
                yearKmMap[year] = distanceValue;
            }
        }
    });

    var layout = {
        title: 'Tour de France Distance (km) by Year',
        xaxis: {
            range: [1903, 2024],
            dtick: 10
        },
        shapes: [{
            type: 'rect',
            xref: 'x',
            yref: 'paper',
            x0: 1914,
            y0: 0,
            x1: 1918,
            y1: 1,
            fillcolor: '#808080',
            opacity: 0.2,
            line: {
                width: 0
            }
        }, {
            type: 'rect',
            xref: 'x',
            yref: 'paper',
            x0: 1939,
            y0: 0,
            x1: 1945,
            y1: 1,
            fillcolor: '#808080',
            opacity: 0.2,
            line: {
                width: 0
            }
        }],
        annotations: [{
            x: 1916,
            y: 0.5,
            xref: 'x',
            yref: 'paper',
            text: 'World War I - No race',
            showarrow: false
        }, {
            x: 1942,
            y: 0.45,
            xref: 'x',
            yref: 'paper',
            text: 'World War II - No race',
            showarrow: false
        }]
    };
    
    var trace = {
        x: Object.keys(yearKmMap),
        y: Object.values(yearKmMap),
        mode: 'lines',
        name: '',
        line: {
            color: 'black',
            width: 2
        },
        hoverinfo: 'none',
        hovertemplate: "<b>Year</b>: %{x}<br><b>Distance</b>: %{y} km",
    };
    
    Plotly.newPlot('distance-chart', [trace], layout);

     Object.keys(yearKmMap).forEach((year, index) => {
        yearIndexMapDistance[year] = index;
     });

     document.getElementById('distance-chart').on('plotly_hover', function(data) {
        var year = data.points[0].x;
        highlightYear(year);
     });
}

function createSpeedChart(data) {
    const yearSpeedMap = {};

    data.forEach(row => {
        const year = row['Year'];
        const speed = row['Avg Speed'];

        if (year && speed) {
            const speedValue = parseFloat(speed.replace('km/h', '').trim());
            if (!isNaN(speedValue)) {
                yearSpeedMap[year] = speedValue;
            }
        }
    });

    var layout = {
        title: 'Tour de France Winner Speed (km/h) by Year',
        xaxis: {
            range: [1903, 2024],
            dtick: 10
        },
        shapes: [{
            type: 'rect',
            xref: 'x',
            yref: 'paper',
            x0: 1914,
            y0: 0,
            x1: 1918,
            y1: 1,
            fillcolor: '#808080',
            opacity: 0.2,
            line: {
                width: 0
            }
        }, {
            type: 'rect',
            xref: 'x',
            yref: 'paper',
            x0: 1939,
            y0: 0,
            x1: 1945,
            y1: 1,
            fillcolor: '#808080',
            opacity: 0.2,
            line: {
                width: 0
            }
        }],
        annotations: [{
            x: 1916,
            y: 0.5,
            xref: 'x',
            yref: 'paper',
            text: 'World War I - No race',
            showarrow: false
        }, {
            x: 1942,
            y: 0.75,
            xref: 'x',
            yref: 'paper',
            text: 'World War II - No race',
            showarrow: false
        }]
    };
    
    var trace = {
        x: Object.keys(yearSpeedMap),
        y: Object.values(yearSpeedMap),
        mode: 'lines',
        name: '',
        line: {
            color: 'black',
            width: 2
        },
        hoverinfo: 'none',
        hovertemplate: "<b>Year</b>: %{x}<br><b>Winning speed</b>: %{y} km/h",
    };
    
    Plotly.newPlot('speed-chart', [trace], layout);

    Object.keys(yearSpeedMap).forEach((year, index) => {
        yearIndexMapSpeed[year] = index;
    });

    document.getElementById('speed-chart').on('plotly_hover', function(data) {
        var year = data.points[0].x;
        highlightYear(year);
    });
}

function createStagesChart(data) {
    const stageTypes = ['Flat stage', 'Mountain stage', 'Hilly stage', 'Team time trial', 'Individual time trial', 'Unknown'];
    const stageCount = {};

    data.forEach(row => {
        const year = row['Year'];
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

        if (!stageCount[year]) {
            stageCount[year] = {
                'Flat stage': 0,
                'Mountain stage': 0,
                'Hilly stage': 0,
                'Team time trial': 0,
                'Individual time trial': 0,
                'Unknown': 0,
                total: 0
            };
        }

        if (stageTypes.includes(stageType)) {
            stageCount[year][stageType]++;
            stageCount[year].total++;
        }
    });    
    
    // Prepare colors based on CUD palette
    const colors = {
        'Flat stage': '#0072B2',
        'Mountain stage': '#CC79A7',
        'Hilly stage': '#009E73',
        'Team time trial': '#D55E00',
        'Individual time trial': '#E69F00',
        'Unknown': 'grey'
    };

    // Prepare data
    const years = Object.keys(stageCount).sort((a, b) => a - b);
    const plotData = stageTypes.map(stageType => {
        return {
            x: years,
            y: years.map(year => stageCount[year][stageType] || 0),
            name: stageType,
            type: 'bar',
            marker: {
                color: colors[stageType]
            },
            customdata: years.map(year => stageCount[year].total),
            hovertemplate: '<b>Year</b>: %{x}<br><b>Stage type</b>: ' + stageType + '<br><b>Number of stages from this stagetype</b>: %{y}<br>' + 
                '<b>Total number of stages</b>: %{customdata}',
        };
    });

    // Layout for the chart
    const layout = {
        title: 'Tour de France Stage Types Over Years',
        barmode: 'stack',
        xaxis: {
            range: [1903, 2024],
            dtick: 5
        },
        yaxis: {
            title: 'Number of Stages'
        },
        shapes: [{
            type: 'rect',
            xref: 'x',
            yref: 'paper',
            x0: 1914,
            y0: 0,
            x1: 1918,
            y1: 1,
            fillcolor: '#808080',
            opacity: 0.2,
            line: {
                width: 0
            }
        }, {
            type: 'rect',
            xref: 'x',
            yref: 'paper',
            x0: 1939,
            y0: 0,
            x1: 1945,
            y1: 1,
            fillcolor: '#808080',
            opacity: 0.2,
            line: {
                width: 0
            }
        }],
        annotations: [{
            x: 1916,
            y: 0.5,
            xref: 'x',
            yref: 'paper',
            text: 'World War I - No race',
            showarrow: false
        }, {
            x: 1942,
            y: 0.75,
            xref: 'x',
            yref: 'paper',
            text: 'World War II - No race',
            showarrow: false
        }]
    };

    // Create the Plotly chart
    Plotly.newPlot('stagetypes-chart', plotData, layout);

    Object.keys(stageCount).forEach((year, index) => {
        yearIndexMapStages[year] = index;
    });

    document.getElementById('stagetypes-chart').on('plotly_hover', function(data) {
        var year = data.points[0].x;
        var curveNumber = data.points[0].curveNumber;
        highlightYear(year, curveNumber);
    });
}

function createStartvsFinishChart(data) {
    const yearStartersMap = {};
    const yearFinishersMap = {};

    data.forEach(row => {
        const year = row['Year'];
        const starters = row['Starters'];
        const finishers = row['Finishers'];

        if (year && starters && finishers) {
            const starterCount = parseInt(starters, 10);
            const finisherCount = parseInt(finishers, 10);

            if (!isNaN(starterCount) && !isNaN(finisherCount)) {
                yearStartersMap[year] = starterCount;
                yearFinishersMap[year] = finisherCount;
            }
        }
    });

    var layout = {
        title: 'Tour de France Starters and Finishers by Year',
        xaxis: {
            range: [Math.min(...Object.keys(yearStartersMap)), Math.max(...Object.keys(yearStartersMap))],
            dtick: 5
        },
        shapes: [{
            type: 'rect',
            xref: 'x',
            yref: 'paper',
            x0: 1914,
            y0: 0,
            x1: 1918,
            y1: 1,
            fillcolor: '#808080',
            opacity: 0.2,
            line: {
                width: 0
            }
        }, {
            type: 'rect',
            xref: 'x',
            yref: 'paper',
            x0: 1939,
            y0: 0,
            x1: 1945,
            y1: 1,
            fillcolor: '#808080',
            opacity: 0.2,
            line: {
                width: 0
            }
        }],
        annotations: [{
            x: 1916,
            y: 0.75,
            xref: 'x',
            yref: 'paper',
            text: 'World War I - No race',
            showarrow: false
        }, {
            x: 1942,
            y: 0.75,
            xref: 'x',
            yref: 'paper',
            text: 'World War II - No race',
            showarrow: false
        }]
    };

    var traceStarters = {
        x: Object.keys(yearStartersMap),
        y: Object.values(yearStartersMap),
        mode: 'lines',
        name: 'Starters',
        line: {
            color: '#0072B2',
            width: 2
        },
        fill: 'tozeroy',
        fillcolor: 'rgba(0, 0, 255, 0.2)',
        hovertemplate: "<b>Year</b>: %{x}<br><b>Starters</b>: %{y}"
    };

    var traceFinishers = {
        x: Object.keys(yearFinishersMap),
        y: Object.values(yearFinishersMap),
        mode: 'lines',
        name: 'Finishers',
        line: {
            color: '#D55E00',
            width: 2
        },
        fill: 'tozeroy',
        fillcolor: 'rgba(0, 128, 0, 0.2)',
        hovertemplate: "<b>Year</b>: %{x}<br><b>Finishers</b>: %{y}"
    };

    Plotly.newPlot('starterfinisher-chart', [traceStarters, traceFinishers], layout);

    Object.keys(yearStartersMap).forEach((year, index) => {
        yearIndexMapStartersFinishers[year] = index;
    });

    document.getElementById('starterfinisher-chart').on('plotly_hover', function(data) {
        var year = data.points[0].x;
        highlightYear(year);
    });
}

function highlightYear(year, curveNumber) {
    var indexDistance = yearIndexMapDistance[year];
    var indexSpeed = yearIndexMapSpeed[year];
    var indexStages = yearIndexMapStages[year];
    var indexStartFinish = yearIndexMapStartersFinishers[year];

    if (indexDistance !== undefined) {
        Plotly.Fx.hover('distance-chart', [{
            curveNumber: 0,
            pointNumber: indexDistance
        }]);
    }

    if (indexSpeed !== undefined) {
        Plotly.Fx.hover('speed-chart', [{
            curveNumber: 0,
            pointNumber: indexSpeed
        }]);
    }

    if (indexStages !== undefined) {
        Plotly.Fx.hover('stagetypes-chart', [{
            curveNumber: curveNumber === undefined ? 0 : curveNumber,
            pointNumber: indexStages
        }]);
    }

    if (indexStartFinish !== undefined) {
        Plotly.Fx.hover('starterfinisher-chart', [{
            curveNumber: 0,
            pointNumber: indexStartFinish
        }, {
            curveNumber: 1,
            pointNumber: indexStartFinish
        }]);
    }
}

function unhighlightAll() {
    Plotly.Fx.unhover('distance-chart');
    Plotly.Fx.unhover('speed-chart');
    Plotly.Fx.unhover('stagetypes-chart');
    Plotly.Fx.unhover('starterfinisher-chart');
}

async function createCharts() {
    const tourData = await fetchAndParseCSV(csvFilePathTours);
    const winnerData = await fetchAndParseCSV(csvFilePathWinners);
    const stageData = await fetchAndParseCSV(csvFilePathStages);
    createDistanceChart(tourData);
    createSpeedChart(winnerData);
    createStagesChart(stageData);
    createStartvsFinishChart(tourData);
}

createCharts();