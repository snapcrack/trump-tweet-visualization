(function () {
    var container = document.getElementById('tree-chart');
    var forceChart = document.getElementById('chart');

    var height = 200;

    // load as of data from text file
    d3.text('https://dl.dropboxusercontent.com/s/943b3jdmwclphuk/as_of_date.txt?dl=1')
    .then(res => {
      var momentDate = moment(res).format('MMMM D, YYYY, h:mm A');
      var momentMonth = moment(res).format('MMMM');

      d3.select('#title')
        .text(`Trump's Tweets as of ${momentDate} EST`);

      init(momentMonth);
    })

    function init (month) {
      var treeData = {
        name: 'root',
        id: 0,
        children: [
          {
            name: 'Phrases',
            id: 1,
            children: [
              { 
                name: 'All',
                container: 'phrases_all',
                initFunction: initPhrasesAll 
              },
              { 
                name: month,
                id: 3,
                enlargeScreen: true,
                children: [
                  {
                    name: 'Unsort',
                    isForce: true,
                    container: 'phrases_month',
                    mode: 'initial'
                  },
                  {
                    name: 'Sort by count',
                    container: 'phrases_month',
                    isForce: true,
                    mode: 'desc'
                  },
                  {
                    name: 'Sort by sentiment',
                    container: 'phrases_month',
                    isForce: true,
                    mode: 'color'
                  }
                ]
              }
            ]
          },
          {
            name: 'Hashtags',
            id: 7,
            children: [
              { 
                name: 'All',
                container: 'hashtags_all',
                initFunction: initHashtagsAll
              },
              { 
                name: month,
                id: 11,
                enlargeScreen: true,
                children: [
                  {
                    name: 'Sort by day',
                    initFunction: initHashtagsMonth,
                    isTimeline: true,
                    container: 'hashtags_month',
                    mode: 'initial'
                  },
                  {
                    name: 'Sort by count',
                    container: 'hashtags_month',
                    initFunction: initHashtagsMonth,
                    isTimeline: true,
                    mode: 'count'
                  },
                  {
                    name: 'Sort by sentiment',
                    container: 'hashtags_month',
                    initFunction: initHashtagsMonth,
                    isTimeline: true,
                    mode: 'sentiment'
                  }
                ]
              }
            ]
          },
          {
            name: 'Mentions',
            id: 10,
            children: [
              { 
                name: 'All' ,
                container: 'mentions_all',
                initFunction: initMentionsAll
              },
              { 
                name: month,
                id: 12,
                enlargeScreen: true,
                children: [
                  {
                    name: 'Sort by day',
                    initFunction: initMentionsMonth,
                    isTimeline: true,
                    container: 'mentions_month',
                    mode: 'initial'
                  },
                  {
                    name: 'Sort by count',
                    container: 'mentions_month',
                    initFunction: initMentionsMonth,
                    isTimeline: true,
                    mode: 'count'
                  },
                  {
                    name: 'Sort by sentiment',
                    container: 'mentions_month',
                    initFunction: initMentionsMonth,
                    isTimeline: true,
                    mode: 'sentiment'
                  }
                ]
              }
            ]
          }
        ]
      };
  
      Tree()
          .data(treeData)
          .container('#tree-chart')
          .onChartSelect(node => {
            // hide all charts
            d3.selectAll('.js-chart-row').classed('d-none', true);
            // show the current chart only
            var _container = document.getElementById(node.data.container);
            _container.classList.remove('d-none');
            // getting the chart instance
            var chart = window['chart_' + node.data.container];
  
            // if chart exists, then we should just show it
            if (chart) {
              if (node.data.isForce || node.data.isTimeline) {
                chart.orderNodes(node.data.mode);
              } 
              // else if (node.data.isTimeline) {
              //   chart.animate(true).render();
              // }
            } 
            // if chart does not exist, we need to initialize it
            else {
              if (node.data.isForce) {
                initBigram(node.data.mode, node.data.container);
              } else {
                if (node.data.isTimeline) {
                  node.data.initFunction(node.data.mode, node.data.container);
                } else {
                  node.data.initFunction(node.data.container);
                }
              }
            }
          })
          .svgWidth(container.getBoundingClientRect().width - 41)
          .svgHeight(height)
          .render();
    }
    
})();
