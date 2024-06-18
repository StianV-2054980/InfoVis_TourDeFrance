var startYearSlider = document.getElementById("startYearRange");
var startYearOutput = document.getElementById("startYear");
var endYearSlider = document.getElementById("endYearRange");
var endYearOutput = document.getElementById("endYear");

endYearSlider.value = localStorage.getItem('endYear') || 2022;
endYearOutput.innerHTML = endYearSlider.value;

endYearSlider.oninput = function() {
  endYearOutput.innerHTML = this.value;
  localStorage.setItem('endYear', this.value);
  startYearSlider.max = this.value;
}

startYearSlider.value = localStorage.getItem('startYear') || 1903;
startYearOutput.innerHTML = startYearSlider.value;

startYearSlider.oninput = function() {
  startYearOutput.innerHTML = this.value;
  localStorage.setItem('startYear', this.value);
  endYearSlider.min = this.value;
}