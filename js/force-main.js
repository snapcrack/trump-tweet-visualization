function initBigram (mode, _container) {
  var sheetUrl = 'https://docs.google.com/spreadsheets/d/1Z8E5tr5gcPAg7Uo_zNj1-AUAIsN0FYrga38tBJyy20g/edit'
  var container = '#' + _container + '_chart';
  var containerDomNode = document.getElementById(container.slice(1));
  var boundingRect = containerDomNode.getBoundingClientRect();
  
  // initilize chart
  var chart = Force()
    .container(container)
    .currentMode(mode)
    .svgWidth(boundingRect.width - 30)
    .svgHeight(500);

  // load data from google sheets
  // loadSheet(sheetUrl)
  d3.csv('https://dl.dropboxusercontent.com/s/m2l4nrafe5joeaj/bigram_month.csv?dl=1')
    .then((response) => {
      chart.data(response)
        .run()
      // remove loader
      d3.selectAll('.loader').remove();
    }, (e) => {
      return alert("Error loading data.");
    })
    .catch((e) => {
      console.error(e)
      return alert("Something went wrong!");
    })

  window['chart_' + _container] = chart;
}
