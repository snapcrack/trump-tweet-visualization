function Force(params) {

  // Exposed variables
  var attrs = {
    id: "ID" + Math.floor(Math.random() * 1000000),  // Id for event handlings
    svgWidth: 400,
    svgHeight: 400,
    marginTop: 10,
    marginBottom: 10,
    marginRight: 10,
    marginLeft: 10,
    minRadius: 4,
    maxRadius: 20,
    clusterCount: 80,
    markerRadius: 60,
    tickCount: 500,
    polygonVerticesCount: 100,
    itemsInARow: 35,
    animationTime: 1000,
    spreading: 90,
    ease: d3.easeExp,
    container: 'body',
    nodeColors: ['#e60000','#9b0000','#001c9b','#134df5'],
    defaultTextFill: '#2C3E50',
    defaultFont: 'sans-serif',
    currentMode: 'initial',
    data: null
  };


  //InnerFunctions which will update visuals
  var updateData;

  // order nodes descending or ascending
  var orderNodes;

  // save points globally
  var points;

  //Main chart object
  var main = function (selection) {
    selection.each(function scope() {

      if (window.innerWidth < 768) {
        attrs.itemsInARow = 22
      }

      var sorters = {
        desc: (a, b) => b.r - a.r,
        color: (a, b) => b.sentiment - a.sentiment
      }

      //Calculated properties
      var calc = {}
      calc.id = "ID" + Math.floor(Math.random() * 1000000);  // id for event handlings
      calc.chartLeftMargin = attrs.marginLeft;
      calc.chartTopMargin = attrs.marginTop;
      calc.chartWidth = attrs.svgWidth - attrs.marginRight - calc.chartLeftMargin;
      calc.chartHeight = attrs.svgHeight - attrs.marginBottom - calc.chartTopMargin;
      calc.countExtent = d3.extent(attrs.data, d => +d.count);
      calc.sentimentExtent = d3.extent(attrs.data, d => +d.sentiment);
      calc.circlePackRadius = Math.min(calc.chartWidth / 2, calc.chartHeight / 2) / 2;

      d3.select('#phrases_month .legend-cicle-label-min')
        .text(calc.countExtent[0]);
      
      d3.select('#phrases_month .legend-cicle-label-max')
        .text(calc.countExtent[1]);

      var disableMarkerMove = attrs.currentMode !== 'initial';

      // create color gradient.
      var scaleColor = d3.piecewise(d3.interpolateRgb.gamma(2.2), attrs.nodeColors);
      // just scale sentiment to [0, 1]
      var colorRange = d3.scaleLinear()
        .domain(calc.sentimentExtent)
        .range([0, 1])
      // computes radius based on count property
      var scaleRadius = d3.scaleLinear()
        .domain(calc.countExtent)
        .range([attrs.minRadius, attrs.maxRadius]);
      // make semi-random radius
      var scaleExponential = d3.scalePow()
        .exponent(0.4)
        .domain([0, attrs.clusterCount / 5])
        .range([5, calc.circlePackRadius])
      // grid scales
      var scaleGridX = d3.scaleBand()
        .domain(d3.range(0, attrs.itemsInARow))
        .range([
          -calc.chartWidth / 2 + attrs.maxRadius / 2,
          calc.chartWidth / 2 - attrs.maxRadius / 2
        ])
      var scaleGridY = d3.scaleBand()
        .domain(d3.range(0, Math.ceil(attrs.data.length / attrs.itemsInARow)))
        .range([
          -calc.chartHeight / 2 + attrs.maxRadius / 2,
          calc.chartHeight / 2 - attrs.maxRadius / 2
        ])

      var randomize = () => {

        var clusters = d3.range(attrs.clusterCount)
            .map(d => {
              var randomAngle = (2 * Math.PI) / (Math.random() * attrs.clusterCount) * d;
              var randomRadius = scaleExponential(Math.floor(d / 5))
              return {
                  x: Math.cos(randomAngle) * randomRadius,
                  y: Math.sin(randomAngle) * randomRadius
              }
            })

        var nodes = attrs.data.map((d, i) => {
          var center = clusters[Math.floor(Math.random() * clusters.length)]
          var randomAngle = Math.random() * (2 * Math.PI);
          var randomRadius = Math.random() * attrs.spreading;
          return {
            initial: {
              x: center.x + Math.cos(randomAngle) * randomRadius,
              y: center.y + Math.sin(randomAngle) * randomRadius
            },
            r: scaleRadius(+d.count),
            c: scaleColor(colorRange(d.sentiment)),
            sentiment: d.sentiment,
            count: d.count,
            name: d.grams,
            id: i
          }
        })

        // initialize force simulation
        var simulation  = d3.forceSimulation()
          .force('collide', d3.forceCollide().radius(d => d.r))
          .force('x', d3.forceX().x(d => d.initial.x))
          .force('y', d3.forceY().y(d => d.initial.y))
          .nodes(nodes.slice())
          .stop()

        for(let i = 0; i < attrs.tickCount; i++) {
          simulation.tick();
        }

        var points = simulation.nodes()
            .map(item => {
                return {
                    initial: {
                        x: item.initial.x,
                        y: item.initial.y
                    },
                    collided: {
                        x: item.x,
                        y: item.y
                    },
                    r: item.r,
                    c: item.c,
                    sentiment: item.sentiment,
                    count: item.count,
                    name: item.name,
                    id: item.id
                }
            })

        return points;

      }

      points = randomize()

      Object.keys(sorters)
        .forEach(key => {
          points.sort(sorters[key])
            .forEach((d, i) => {
              let column = i % attrs.itemsInARow
              let row = Math.floor(i / attrs.itemsInARow)
              d[key] = {}
              d[key].x = scaleGridX(column) + scaleGridX.bandwidth() / 2
              d[key].y = scaleGridY(row) + scaleGridY.bandwidth() / 2
              return d
            })
        })

      var getVertices = (center = [calc.chartWidth * 0.5, calc.chartHeight * 0.5]) => {
          return d3.range(attrs.polygonVerticesCount)
              .map(index => {
                  const angle = 2 * Math.PI / attrs.polygonVerticesCount * index
                  const x = attrs.markerRadius * Math.cos(angle)
                  const y = attrs.markerRadius * Math.sin(angle)
                  return [x, y]
              })
              .map(item => {
                  return [
                      item[0] + center[0],
                      item[1] + center[1]
                  ]
              })
      }

      var placePoints = polygon => {
          // position points
          chart.selectAll('circle.node')
            .transition()
            .duration(200)
            .ease(d3.easeLinear)
            .attr('cx', d => d3.polygonContains(polygon, [d.initial.x, d.initial.y]) ? d.collided.x : d.initial.x)
            .attr('cy', d => d3.polygonContains(polygon, [d.initial.x, d.initial.y]) ? d.collided.y : d.initial.y)
      }

      //Drawing containers
      var container = d3.select(this);

      //Add svg
      var svg = container.patternify({ tag: 'svg', selector: 'svg-chart-container' })
        .attr('width', attrs.svgWidth)
        .attr('height', attrs.svgHeight)
        .attr('font-family', attrs.defaultFont)
        .on('mousemove', function() {
              if (disableMarkerMove) return;

              const position = d3.mouse(this)
              // reposition the circle
              marker
                  .select('circle')
                  .attr('cx', position[0])
                  .attr('cy', position[1])

              // change the vertices of the polygon
              const polygon = getVertices([
                position[0] - calc.chartWidth / 2,
                position[1] - calc.chartHeight / 2
              ])
              marker
                  .select('polygon')
                  .attr('points', polygon.join(' '))
              placePoints(polygon)
        })

      //Add container g element
      var chart = svg.patternify({ tag: 'g', selector: 'chart' })
        .attr('transform', `translate(${calc.chartLeftMargin + calc.chartWidth / 2}, ${calc.chartTopMargin + calc.chartHeight / 2})`);

      let marker = svg.patternify({ tag: 'g', selector: 'marker' })

      marker.patternify({ tag: 'circle', selector: 'marker-circle' })
            .attr('r', attrs.markerRadius)
      marker.patternify({ tag: 'polygon', selector: 'marker-polygon' })
            .attr('points', getVertices().join(' '))

      //Add nodes
      var nodeSelection = chart.patternify({ tag: 'circle', selector: 'node', data: points })
        .attr('r', d => d.r)
        .attr('cx', d => d[attrs.currentMode].x)
        .attr('cy', d => d[attrs.currentMode].y)
        .attr('fill', d => d.c)
        .attr('cursor', 'pointer')

      // attach tooltip to all nodes
      nodeSelection.each(function(d) {
        let node = this;
        tippy(node, {
          content: getTooltipHtml(d),
          arrow: true,
          theme: 'light',
          animation: 'scale',
          duration: 200
        })
      })

      function getTooltipHtml(d) {
        var html = document.createElement('div')
        html.innerHTML = `
          <div class="d-flex justify-content-between">
            <span class="mr-2 bold">Phrase: </span>
            <span class="no-bold">${d.name}</span>
          </div>
          <div class="d-flex justify-content-between">
            <span class="mr-2 bold">Count: </span>
            <span class="no-bold">${d.count}</span>
          </div>
          <div class="d-flex justify-content-between">
            <span class="mr-2 bold">Sentiment: </span>
            <span class="no-bold">${d.sentiment}</span>
          </div>
          `
        return html;
      }

      orderNodes = (sortOrder) => {
        if (sortOrder === 'desc' || sortOrder === 'color') {
          disableMarkerMove = true;
        } else {
          sortOrder = 'initial';
          disableMarkerMove = false;
        //   points = randomize()
        //     .map((d, i) => {
        //       Object.keys(sorters)
        //         .forEach(k => {
        //           d[k] = points[i][k]
        //         })
        //       return d
        //     })
        }

        // position points
        chart.selectAll('circle.node')
          .data(points)
          .transition()
          .duration(attrs.animationTime)
          .ease(attrs.ease)
          .attr('cx', d => d[sortOrder].x)
          .attr('cy', d => d[sortOrder].y)

        // save current mode
        attrs.currentMode = sortOrder;
      }

      // Smoothly handle data updating
      updateData = function () {

      }

      handleWindowResize();


      //#########################################  UTIL FUNCS ##################################
      function handleWindowResize() {
        d3.select(window).on('resize.' + attrs.id, function () {
          setDimensions();
        });
      }


      function setDimensions() {
        setSvgWidthAndHeight();
        container.call(main);
      }

      function setSvgWidthAndHeight() {
        var containerRect = container.node().getBoundingClientRect();
        if (containerRect.width > 0)
          attrs.svgWidth = containerRect.width - 30;
        if (containerRect.height > 0)
          attrs.svgHeight = containerRect.height;
      }
    });
  };

  //----------- PROTOTYEPE FUNCTIONS  ----------------------
  d3.selection.prototype.patternify = function (params) {
    var container = this;
    var selector = params.selector;
    var elementTag = params.tag;
    var data = params.data || [selector];

    // Pattern in action
    var selection = container.selectAll('.' + selector).data(data, (d, i) => {
      if (typeof d === "object") {
        if (d.id) {
          return d.id;
        }
      }
      return i;
    })
    selection.exit().remove();
    selection = selection.enter().append(elementTag).merge(selection)
    selection.attr('class', selector);
    return selection;
  }

  //Dynamic keys functions
  Object.keys(attrs).forEach(key => {
    // Attach variables to main function
    return main[key] = function (_) {
      var string = `attrs['${key}'] = _`;
      if (!arguments.length) { return eval(` attrs['${key}'];`); }
      eval(string);
      return main;
    };
  });

  //Set attrs as property
  main.attrs = attrs;

  main.orderNodes = function (sortOrder) {
    if (typeof orderNodes === 'function') {
      orderNodes(sortOrder);
    }
    return main;
  }

  //Exposed update functions
  main.data = function (value) {
    if (!arguments.length) return attrs.data;
    attrs.data = value;
    if (typeof updateData === 'function') {
      updateData();
    }
    return main;
  }

  // Run  visual
  main.run = function () {
    d3.selectAll(attrs.container).call(main);
    return main;
  }

  return main;
}
