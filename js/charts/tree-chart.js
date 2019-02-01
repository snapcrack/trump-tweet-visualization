function Tree() {

    // Exposed variables
    var attrs = {
      id: "ID" + Math.floor(Math.random() * 1000000),  // Id for event handlings
      svgWidth: 400,
      svgHeight: 400,
      marginTop: 5,
      marginBottom: 5,
      marginRight: 5,
      marginLeft: 5,
      onChartSelect: d => d,
      container: 'body',
      defaultTextFill: '#2C3E50',
      defaultFont: 'Helvetica',
      data: null
    };

    var isFirstLoaded = true;
  
    //Main chart object
    var main = function () {
  
        //Calculated properties
        var calc = {}
        calc.id = "ID" + Math.floor(Math.random() * 1000000);  // id for event handlings
        calc.chartLeftMargin = attrs.marginLeft;
        calc.chartTopMargin = attrs.marginTop;
        calc.chartWidth = attrs.svgWidth - attrs.marginRight - calc.chartLeftMargin;
        calc.chartHeight = attrs.svgHeight - attrs.marginBottom - calc.chartTopMargin;

        //Drawing containers
        var container = d3.select(attrs.container);

        //Add svg
        var svg = container.patternify({ tag: 'svg', selector: 'svg-chart-container' })
        .attr('width', attrs.svgWidth)
        .attr('height', attrs.svgHeight)
        .attr('font-family', attrs.defaultFont);

        //Add container g element
        var chart = svg.patternify({ tag: 'g', selector: 'chart' })
        .attr('transform', 'translate(' + (calc.chartLeftMargin) + ',' + (calc.chartTopMargin + 60) + ')');

        var i = 0,
        duration = 750,
        root;
        var currentRootNodeId;

        // declares a tree layout and assigns the size
        var treemap = d3.tree().size([calc.chartWidth, calc.chartHeight]);

        // Assigns parent, children, height, depth
        root = d3.hierarchy(attrs.data, function(d) { return d.children; });
        
        root.x0 = calc.chartWidth / 2;
        root.y0 = 0;

        var allNodes = treemap(root).descendants();
        
        // Collapse after the second level
        root.children.forEach(collapse);

        update(root);

        // Collapse the node and all it's children
        function collapse(d, x) {
            if (x && d === x) {
                return;
            }
            d.clicked = null;
            if(d.children) {
                d._children = d.children
                d.children = null
                d._children.forEach(collapse);
            }
        }

        function radius (d) {
            var r;
            if (isMobile.any()) {
                r = d.depth == 1 ? 30 : 27;
            } else {
                r = d.depth == 1 ? 45 : 35;
            }
            return r;
        }

        function update(source) {
            // Assigns the x and y position for the nodes
            var treeData = treemap(root);

            // Compute the new tree layout.
            var nodes = treeData.descendants().slice(1),
                links = treeData.descendants().slice(4);

            // Normalize for fixed-depth.
            nodes.forEach(function(d) {
                d.y = (d.depth - 1) * 90;
            });

            // ****************** Nodes section ***************************

            // Update the nodes...
            var node = chart.selectAll('g.node')
                .data(nodes, function(d) {return d.id || (d.id = ++i); });

            // Enter any new modes at the parent's previous position.
            var nodeEnter = node.enter().append('g')
                .lower()
                .attr('class', 'node')
                .attr("transform", function(d) {
                    return "translate(" + source.x0 + "," + source.y0 + ")";
                })
                .on('click', click)
                .on('mouseover', function (d) {
                    if (d.clicked || isMobile.any() || isFirstLoaded) return;

                    d3.select(this)
                        .selectAll('circle')
                        .transition()
                        .duration(100)
                        .attr('fill', '#dae0e5')
                })
                .on('mouseout', function (d) {
                    if (d.clicked  || isMobile.any() || isFirstLoaded) return;

                    d3.select(this)
                        .selectAll('circle')
                        .transition()
                        .duration(100)
                        .attr('fill', '#f8f9fa')
                });

            // Add Circle for the nodes
            nodeEnter.append('circle')
                .attr('class', 'node-circle')
                .attr('r', d => radius(d))
                .attr("fill", d => (d.clicked || isFirstLoaded) ? '#2ebe60' : '#f8f9fa');

            // Add labels for the nodes
            var texts = nodeEnter.append('text')
                .attr("dy", ".35em")
                .attr('y', 0)
                .attr('x', 0)
                .attr("text-anchor", 'middle')
                .attr('font-size', d => d.depth < 3 ? 11 + 'px' : 10 + 'px')
                .text(function(d) { return d.data.name; });

            if (source.depth == 2) {
                texts
                    .attr('y', d => d.data.name.split(' ').length == 1 ? 5 : -3)
                    .call(wrap, 50)
            }

            // UPDATE
            var nodeUpdate = nodeEnter.merge(node);

            // Transition to the proper position for the node
            nodeUpdate.transition()
                .duration(duration)
                .attr("transform", function(d) { 
                    return "translate(" + d.x + "," + d.y + ")";
                });

            // Update the node attributes and style
            nodeUpdate.select('circle.node-circle')
                .attr('r', d => radius(d))
                .attr("fill", d => (d.clicked || isFirstLoaded) ? '#2ebe60' : '#f8f9fa')
                .attr('cursor', 'pointer');

            // Remove any exiting nodes
            var nodeExit = node.exit().transition()
                .duration(duration)
                .attr("transform", function(d) {
                    return "translate(" + d.parent.x + "," + d.parent.y + ")";
                })
                .remove();

            // On exit reduce the node circles size to 0
            nodeExit.select('circle')
                .attr('r', d => radius(d))

            // On exit reduce the opacity of text labels
            nodeExit.select('text')
                .style('fill-opacity', 1e-6);

            // ****************** links section ***************************

            // Update the links...
            var link = chart.selectAll('path.link')
                .data(links, function(d) { return d.id; });

            // Enter any new links at the parent's previous position.
            var linkEnter = link.enter().insert('path', "g")
                .attr("class", "link")
                .attr('d', function(d){
                    var o = {x: source.x0, y: source.y0}
                    return diagonal(o, o)
                });

            // UPDATE
            var linkUpdate = linkEnter.merge(link);

            // Transition back to the parent element position
            linkUpdate.transition()
                .duration(duration)
                .attr('d', function(d){ return diagonal(d, d.parent) });

            // Remove any exiting links
            var linkExit = link.exit().transition()
                .duration(duration)
                .attr('d', function(d) {
                    var o = {x: d.parent.x, y: d.parent.y}
                    return diagonal(o, o)
                })
                .remove();

            // Store the old positions for transition.
            nodes.forEach(function(d) {
                d.x0 = d.x;
                d.y0 = d.y;
            });

            // Creates a curved (diagonal) path from parent to the child nodes
            function diagonal(s, d) {

                path = `M ${s.x} ${s.y}
                        C ${(s.x + d.x) / 2} ${s.y},
                        ${(s.x + d.x) / 2} ${d.y},
                        ${d.x} ${d.y}`

                return path
            }

            // Toggle children on click.
            function click(d) {
                var shouldWait = false;
                isFirstLoaded = false;

                if (d.children || d._children) {
                    svg
                        .transition()
                        .duration(duration)
                        .attr('height', attrs.svgHeight);

                    // collapse
                    if (d.children) {
                        d.children.forEach(x => {
                            if (x.children) {
                                shouldWait = true;
                            }
                            collapse(x);
                        });

                        if (shouldWait) {
                            update(d);
                        }
                        
                        d._children = d.children;
                        d.children = null;
                        d.clicked = null;
                    } 
                    // expand
                    else {
                        d.children = d._children;
                        d._children = null;
                        d.clicked = true;

                        if (d.data.enlargeScreen) {
                            svg
                                .transition()
                                .duration(duration)
                                .attr('height', 300)
                        }

                        let third = allNodes.filter(x => x.data.id === getThirdLevelId());
                        if (d.depth === 1 && third.length && third[0].clicked) {
                            collapse(third[0])
                            update(d);
                            shouldWait = true;
                        }
                    }

                    if (d.depth == 1) {
                        root.children.forEach(x => {
                            collapse(x, d);
                        });
                    }

                    if (shouldWait) {
                        setTimeout(() => {
                            update(d);  
                        }, duration + 20);
                    } else {
                        update(d);
                    }
                    
                } else {
                    let third = allNodes.filter(x => x.data.id === getThirdLevelId());
                    if (d.depth === 2 && third.length && third[0].clicked) {
                        setTimeout(() => {
                            collapse(third[0])
                            update(d);
                        }, 100);

                        shouldWait = true;
                    }

                    if (d.depth == 2) {
                        setTimeout(() => {
                            svg
                                .transition()
                                .duration(duration)
                                .attr('height', attrs.svgHeight);
                        }, 100);
                    }

                    nodeUpdate.each(function(x) {
                        if (x.clicked && x !== d.parent && x.depth > 1) {
                            x.clicked = null;
                            d3.select(this).select('circle.node-circle')
                                .attr('fill', '#f8f9fa');
                        }
                    });
                    
                    d.clicked = true;

                    d3.select(this).select('circle.node-circle')
                        .attr('fill', '#2ebe60');
                    
                    setTimeout(() => {
                        attrs.onChartSelect(d);
                    }, 0);
                }

                if (d.depth === 1) {
                    currentRootNodeId = d.data.id;
                }
            }

            function getThirdLevelId () {
                if (currentRootNodeId == 1) {
                    return 3;
                } else if (currentRootNodeId == 7) {
                    return 11;
                } else {
                    return 12;
                }
            }
        }

        function wrap(text, width) {
            text.each(function () {
                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    x = text.attr("x"),
                    y = text.attr("y"),
                    dy = 0, //parseFloat(text.attr("dy")),
                    tspan = text.text(null)
                                .append("tspan")
                                .attr("x", x)
                                .attr("y", y)
                                .attr("dy", dy + "em");
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan")
                                    .attr("x", x)
                                    .attr("y", y)
                                    .attr("dy", ++lineNumber * lineHeight + dy + "em")
                                    .text(word);
                    }
                }
            });
        }
    
        //   handleWindowResize();
    
    
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
            if (containerRect.width > 0)
                attrs.svgWidth = containerRect.width;
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
  
    //Exposed update functions
    main.data = function (value) {
      if (!arguments.length) return attrs.data;
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