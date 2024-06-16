        // Path to your CSV file
        const csvFilePath = '../data/tdf_tours.csv';

        // Function to fetch and parse CSV file
        async function fetchAndParseCSV() {
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
        async function createChart() {
            const data = await fetchAndParseCSV();
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
                    range: [1903, 2024]
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
                    text: 'World War I',
                    showarrow: false
                }, {
                    x: 1942,
                    y: 0.5,
                    xref: 'x',
                    yref: 'paper',
                    text: 'World War II',
                    showarrow: false
                }]
            };
            
            var trace = {
                x: Object.keys(yearKmMap),
                y: Object.values(yearKmMap),
                mode: 'lines',
                name: '',
                hovertemplate: "<b>Year</b>: %{x}<br><b>Distance</b>: %{y} km",
            };
            
            Plotly.newPlot('distance-chart', [trace], layout);
        }

        // Initialize the chart creation
        createChart();