function initMentionsMonth (mode, _container) {
    var sheetUrl = 'https://docs.google.com/spreadsheets/d/1nPbLjwKqtlkxWCvPiS9ijE23Go9B9a0qkycQfKnF984/edit';
    var container = '#' + _container + '_chart';
    var containerDomNode = document.getElementById(container.slice(1));
    var boundingRect = containerDomNode.getBoundingClientRect();
  
    var chart = Timeline()
      .currentMode(mode)
      .container(container)
      .svgWidth(boundingRect.width - 30)
      .mode('mentions')
      .svgHeight(400)
  
    // loading data from google sheets
    // loadSheet(sheetUrl)
    d3.csv('./data/mention_df.csv')
      .then(response => {
        // var data = {
        //   mentions: response['mention_df'].elements
        // };
        var data = {
          mentions: response
        };
        containerDomNode.innerHTML = '';
        chart.data(data).render();
      }, (e) => {
        return alert("Error loading data!");
      })
      .catch((e) => {
        console.error(e)
        return alert("Something went wrong!");
      })
    window['chart_' + _container] = chart;
  }