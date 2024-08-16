// Determine the base URL
var baseURL = window.location.hostname === 'localhost' ? '' : '/InfoVis_TourDeFrance';

// Construct the full URLs
var csvFilePathWinners = baseURL + '/data/tdf_winners.csv';
var csvFilePathTours = baseURL + '/data/tdf_tours.csv';
var csvFilePathStages = baseURL + '/data/tdf_stages.csv';
var csvFilePathFinishers = baseURL + '/data/tdf_finishers.csv';

// From https://www.kaggle.com/datasets/pablomonleon/tour-de-france-historic-stages-data
var csvFilePathStageResults = baseURL + '/data/stage_data.csv';

// TODO: Get all riders from the data
// TODO: When rider selected, fetch and show information about the rider