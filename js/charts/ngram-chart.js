function Scatterplot() {

    // Exposed variables
    var attrs = {
      id: "ID" + Math.floor(Math.random() * 1000000),  // Id for event handlings
      svgWidth: 400,
      svgHeight: 400,
      marginTop: 25,
      marginBottom: 50,
      marginRight: 25,
      marginLeft: 50,
      animationTime: 1000,
      container: 'body',
      nodeColors: ['#e60000','#9b0000','#001c9b','#134df5'],
      defaultTextFill: '#2C3E50',
      defaultFont: 'sans-serif',
      data: null
    };

    var transition = false;
  
    //Main chart object
    var main = function () {
      if (attrs.svgWidth <= 0) {
        attrs.svgWidth = d3.select('.container-fluid').node().getBoundingClientRect().width - 30;
      }
      //Calculated properties
      var calc = {}
      calc.id = "ID" + Math.floor(Math.random() * 1000000);  // id for event handlings
      calc.chartLeftMargin = attrs.marginLeft;
      calc.chartTopMargin = attrs.marginTop;
      calc.chartWidth = attrs.svgWidth - attrs.marginRight - calc.chartLeftMargin;
      calc.chartHeight = attrs.svgHeight - attrs.marginBottom - calc.chartTopMargin;
        
      calc.minYear = d3.min(attrs.data, d => d.year);
      calc.maxYear = d3.max(attrs.data, d => d.year);

      calc.minCount = Math.min(0, d3.min(attrs.data, d => d.count));
      calc.maxCount = Math.max(10, d3.max(attrs.data, d => d.count));

      calc.minRetweets = Math.min(0, d3.min(attrs.data, d => d.retweets));
      calc.maxRetweets = Math.max(10, d3.max(attrs.data, d => d.retweets));
    
      var xScale = d3.scaleTime()
        .domain([new Date(calc.minYear, 0, 1), new Date(calc.maxYear, 11, 31)])
        .range([0, calc.chartWidth])

      var xAxis = d3.axisBottom(xScale);

      if (isMobile.any()) {
        xAxis.ticks(Math.floor(calc.chartWidth / 60));
      }

      var yScale = d3.scaleLinear()
        .domain([calc.minCount, calc.maxCount])
        .range([calc.chartHeight, 0])

      var yAxis = d3.axisLeft(yScale)

      var radiusScale = d3.scaleLinear()
        .domain([calc.minRetweets, calc.maxRetweets])
        .range([5, 15]);

      // create color gradient.
      var scaleColor = d3.piecewise(d3.interpolateRgb.gamma(2.2), attrs.nodeColors);

      //Drawing containers
      var container = d3.select(attrs.container);
  
      //Add svg
      var svg = container.patternify({ tag: 'svg', selector: 'svg-chart-container' })
        .attr('width', attrs.svgWidth)
        .attr('height', attrs.svgHeight)
        .attr('font-family', attrs.defaultFont);
  
      //Add container g element
      var chart = svg.patternify({ tag: 'g', selector: 'chart' })
        .attr('transform', 'translate(' + (calc.chartLeftMargin) + ',' + calc.chartTopMargin + ')');

      var xAxisLayer = chart.patternify({ tag: 'g', selector: 'x-axis' })
        .attr('transform', 'translate(0,' + calc.chartHeight + ')')
        .classed('axis', true)
        .transition()
        .duration(transition ? attrs.animationTime : 0)
        .call(xAxis)
        .selectAll("text")	
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-45)");

      var yAxisLayer = chart.patternify({ tag: 'g', selector: 'y-axis' })
        .attr('transform', 'translate(-15)')
        .classed('axis', true)
        .transition()
        .duration(transition ? attrs.animationTime : 0)
        .call(yAxis);

      var points = chart.patternify({ tag: 'circle', selector: 'point', data: attrs.data })
        .attr('r', d => radiusScale(d.retweets))
        .transition()
        .duration(transition ? attrs.animationTime : 0)
        .attr('cy', d => yScale(d.count))
        .attr('cx', d => xScale(new Date(d.year, d.month - 1, 15)))
        .attr('fill', d => scaleColor(d.sentiment));
      
      // attach tooltip to all circles
      points
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

      handleWindowResize();
      
      function getTooltipHtml(d) {
        var month = new Date(d.year, d.month - 1, 15);
        var date = moment(month).format('MMMM YYYY');

        var html = document.createElement('div');
        html.classList.add('tooltip-container')

        html.innerHTML = `
          <div class="tooltip-header">
            ${date}
          </div>
          <div class="d-flex justify-content-between">
            <span class="mr-2 bold">Count: </span>
            <span class="no-bold">${d.count}</span>
          </div>
          <div class="d-flex justify-content-between">
            <span class="mr-2 bold">Sentiment: </span>
            <span class="no-bold">${d.sentiment}</span>
          </div>
          <div class="d-flex justify-content-between">
            <span class="mr-2 bold">Retweets: </span>
            <span class="no-bold">${d.retweets}</span>
          </div>
          `
        return html;
      }
  
      //#########################################  UTIL FUNCS ##################################
      function handleWindowResize() {
        d3.select(window).on('resize.' + attrs.id, function () {
          setDimensions();
        });
      }
  
  
      function setDimensions() {
        setSvgWidthAndHeight();
        main();
      }
  
      function setSvgWidthAndHeight() {
        var containerRect = container.node().getBoundingClientRect();
        if (containerRect.width > 0) {
          attrs.svgWidth = containerRect.width - 30;
        }
      }

      transition = false;
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
  
    //Exposed update functions
    main.data = function (value) {
      if (!arguments.length) return attrs.data;
      if (attrs.data) {
          transition = true;
      }
      attrs.data = value;
      return main;
    }
  
    // Run  visual
    main.render = function () {
      main();
      return main;
    }
  
    return main;
  }