function Timeline() {

  // Exposed variables
  var attrs = {
    id: "ID" + Math.floor(Math.random() * 1000000),  // Id for event handlings
    svgWidth: 400,
    svgHeight: 400,
    marginTop: 5,
    marginBottom: 5,
    marginRight: 5,
    marginLeft: 5,
    transitionDuration: 50,
    container: 'body',
    mode: 'hashtags',
    colors: ['#e60000','#9b0000','#001c9b','#134df5'],
    defaultTextFill: '#2C3E50',
    defaultFont: 'sans-serif',
    currentMode: 'initial',
    data: null
  };

  //InnerFunctions which will update visuals
  var updateData;
  // order nodes descending or ascending
  var orderNodes;
  var transition = true;

  //Main chart object
  var main = function () {

    //Calculated properties
    var calc = {}
    calc.id = "ID" + Math.floor(Math.random() * 1000000);  // id for event handlings
    calc.chartLeftMargin = attrs.marginLeft;
    calc.chartTopMargin = attrs.marginTop;
    calc.chartWidth = attrs.svgWidth - attrs.marginRight - calc.chartLeftMargin;
    calc.chartHeight = attrs.svgHeight - attrs.marginBottom - calc.chartTopMargin;

    var days = d3.nest()
      .key(d => d.day)
      .entries(attrs.data[attrs.mode])
      .map(d => {
        return {
          key: d.key,
          values: d.values,
          count: d.values.length,
          sentimentMean: d3.mean(d.values.map(d => +d.sentiment))
        }
      })

    var xScale = d3.scaleBand()
      .paddingOuter(0.5)
      .range([0, calc.chartWidth])
      .domain(days.map(d => d.key))

    var xScaleCount = d3.scaleBand()
      .paddingOuter(0.5)
      .range([0, calc.chartWidth])
      .domain(days.slice().map(d => {
        var len = d.values.filter(d => d.tag && d.tag.length).length;
        if (len === 0) {
          d.count = -1;
        }
        return d;
      })
      .sort((a, b) => b.count - a.count).map(d => d.key))

    var xScaleSentiment = d3.scaleBand()
      .paddingOuter(0.5)
      .range([0, calc.chartWidth])
      .domain(days.slice().map(d => {
        var len = d.values.filter(d => d.tag && d.tag.length).length;
        if (len === 0) {
          d.sentimentMean = -1;
        }
        return d;
      })
      .sort((a, b) => b.sentimentMean - a.sentimentMean).map(d => d.key))

    var yScale = d3.scaleLinear()
      .domain(d3.extent(days, d => d.values.length))
      .range([30, 100])

    var scaleColor = d3.piecewise(d3.interpolateRgb.gamma(2.2), attrs.colors);

    // just scale average sentiment on a day to [0, 1]
    var colorRange = d3.scaleLinear()
      .domain(d3.extent(days, d => d.sentimentMean))
      .range([0, 1])

    var colorRangeIndividual = d3.scaleLinear()
      .domain(d3.extent(attrs.data[attrs.mode], d => +d.sentiment))
      .range([0, 1])

    //Drawing containers
    var container = d3.select(attrs.container);

    //Add svg
    var svg = container.patternify({ tag: 'svg', selector: 'svg-chart-container' })
      .attr('width', attrs.svgWidth)
      .attr('height', attrs.svgHeight)
      .attr('font-family', attrs.defaultFont);

    //Add container g element
    var chart = svg.patternify({ tag: 'g', selector: 'chart' })
      .attr('transform', 'translate(' + (calc.chartLeftMargin) + ',' + (calc.chartTopMargin) + ')');

    var timeline = chart.patternify({ tag: 'line', selector: 'time-line' })
      .attr('x1', 0)
      .attr('x2', calc.chartWidth)
      .attr('y1', calc.chartHeight / 2)
      .attr('y2', calc.chartHeight / 2)
    
    var properxScale = getProperXScale();

    var rectangles = chart.patternify({ tag: 'rect', selector: 'day-rect', data: days })
      .attr('x', d => properxScale(d.key))
      .attr('width', properxScale.bandwidth())
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('y', d => calc.chartHeight / 2)
      .attr('height', 0)
      .transition()
      .duration(transition ? attrs.transitionDuration * days.length : 0)
      .delay((d, i) => transition ? i * attrs.transitionDuration : 0)
      .ease(d3.easeElastic)
      .attr('fill', d => scaleColor(colorRange(d.sentimentMean)))
      .attr('height', d => {
        var count = d.values.filter(d => d.tag && d.tag.length).length;
        if (count > 0) {
          var y = yScale(count);
          return y;
        }
        return 0
      })
      .attr('y', d => calc.chartHeight / 2 - yScale(d.values.length) / 2)

    // attach tooltip to all rectangles
    container
    .selectAll('rect.day-rect')
    .each(function(d) {
      let node = this;
      let tip = node._tippy;
      if (tip) {
        tip.destroy()
      }
      tippy(node, {
        content: getTooltipHtml(d),
        arrow: true,
        theme: 'light',
        animation: 'scale',
        duration: 200
      })
    })

    orderNodes = function (mode) {
      attrs.currentMode = mode;

      container
        .selectAll('rect.day-rect')
          .transition()
          .duration(750)
          .attr('x', d => getProperXScale()(d.key))
    };

    handleWindowResize();

    function getProperXScale () {
      if (attrs.currentMode === 'initial') {
        return xScale;
      } else if (attrs.currentMode === 'count') {
        return xScaleCount;
      } else {
        return xScaleSentiment;
      }
    }

    function getTooltipHtml(d) {
      var html = document.createElement('div')
      html.classList.add('timeline-tooltip')
      html.innerHTML = `
        <div class="text-center day">
          ${ordinal_suffix_of(+d.key)}
        </div>
        ${d.values
          .sort((a, b) => +a.sentiment - (+b.sentiment))
          .map(x => `<div class="text-left" style="color: ${scaleColor(colorRangeIndividual(+x.sentiment))}">
                ${x.tag} 
                <span class="font-small text-black">
                  <span class="bold small-margin">Retweets:</span>
                  <span class="no-bold">${x.retweets}</span>
                  <span class="bold small-margin">Sentiment:</span>
                  <span class="no-bold">${Number.parseFloat(x.sentiment).toFixed(2)}</span>
                  <span class="bold small-margin">Favorites:</span>
                  <span class="no-bold">${Number.parseFloat(x.likes).toFixed(2)}</span>
                </span>
              </div>`)
          .join('')}
        `;
      return html;
    }

    function ordinal_suffix_of(i) {
        var j = i % 10,
            k = i % 100;
        if (j == 1 && k != 11) {
            return i + "st";
        }
        if (j == 2 && k != 12) {
            return i + "nd";
        }
        if (j == 3 && k != 13) {
            return i + "rd";
        }
        return i + "th";
    }

    //#########################################  UTIL FUNCS ##################################
    function handleWindowResize() {
      d3.select(window).on('resize.' + attrs.id, function () {
        transition = false;
        setDimensions();
      });
    }


    function setDimensions() {
      setSvgWidthAndHeight();
      main();
    }

    function setSvgWidthAndHeight() {
      var containerRect = container.node().getBoundingClientRect();
      if (containerRect.width > 0)
        attrs.svgWidth = containerRect.width - 30;
      //if (containerRect.height > 0)  attrs.svgHeight = containerRect.height;
    }

  };

  //----------- PROTOTYPE FUNCTIONS  ----------------------
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

  //Change mode of the chart
  main.changeMode = function (mode) {
    if (mode != attrs.mode) {
      attrs.mode = mode;
      transition = true;
      main();
      transition = false;
    }
    return main;
  }

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

  main.animate = function (value) {
    transition = value;
    return main;
  }

  // Run  visual
  main.render = function () {
    main();
    return main;
  }

  return main;
}
