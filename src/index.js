import axios from 'axios';
import * as d3 from 'd3';
import './css/bar-chart.css';

function myPluginLoadEvent(func) {
  // assign any pre-defined functions on 'window.onload' to a variable
  var oldOnLoad = window.onload;
  // if there is not any function hooked to it
  if (typeof window.onload != 'function') {
    // you can hook your function with it
    window.onload = func
  } else { // someone already hooked a function
    window.onload = function () {
      // call the function hooked already
      oldOnLoad();
      // call your awesome function
      func();
    }
  }
}

// pass the function you want to call at 'window.onload', in the function defined above
myPluginLoadEvent(function(){

  const margin = {top: 20, bottom: 20, right: 20, left: 50};
  const width = 900;
  const height = 400;
  let hovering = false;

  // svg canvas
  let svg = d3.select('svg')
    .style('width', width + 'px')
    .style('height', height + 'px');

  let appBody = d3.select('#App-body');

  // tooltip div
  let tooltip = appBody
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  // Legend
  let legend = appBody
    .append('div')
    .attr('class', 'legend');

  console.log("legend:", legend);

  axios.get('https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/GDP-data.json')
    .then(function (response) {
      handleDatas(response.data);
    })
    .catch(function (error) {
      window.console.log('error:', error);
    });

  const handleDatas = (responseDatas) => {
    const datas = responseDatas.data;
    const rectWidth = (width) / datas.length;

    // Legend
    console.log("responseDatas:", responseDatas);
    let descSplit = [];
    if (responseDatas.description)
      descSplit = responseDatas.description.split(/\n/);

    const description = descSplit.map( (sentence, index) => {
      if (index > 0)
        return `<p>${sentence}</p>`;
    }).join("");

    legend.html(description);

    const legendY = "Units: Billions of Dollars";

    // Datas
    let parseDatas = [];
    datas.map(d => {
      let date = d[0].split('-').join(' ');
      // date = d3.timeFormat("%B %Y")(date);
      date = new Date(date);
      let gdp = d[1];
      parseDatas.push({ date, gdp });
    });

    console.log('parseDatas:', parseDatas);

    // Scales
    const xExtent = d3.extent(parseDatas, d => d.date);
    const xScale = d3.scaleTime()
      .domain(xExtent)
      .range([margin.left, width - margin.right]);

    const yMax = d3.max(parseDatas, d => d.gdp);
    const yScale = d3.scaleLinear()
      .domain([0, yMax])
      .range([height - margin.bottom, margin.top]);

    const heightScale = d3.scaleLinear()
      .domain([0, yMax])
      .range([0, height - margin.bottom - margin.top]);

    // axis
    const xAxis = d3.axisBottom().scale(xScale);
    const yAxis = d3.axisLeft().scale(yScale);

    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(xAxis);

    let yAxisG = svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`);
    yAxisG.append('text')
      .attr('transform','rotate(-90)')
      .attr('y', '20')
      .attr('x', '-20')
      .style('text-anchor', 'end')
      .style('font-size', '16px')
      .attr('fill', 'black')
      .text(legendY);
    yAxisG.call(yAxis);

    // render rectangles
    svg.selectAll('rect')
      .data(parseDatas, d => d.date)
      .enter().append('rect')
      .attr('x', d => xScale(d.date))
      .attr('y', d => yScale(d.gdp))
      .attr('width', rectWidth)
      .attr('height', d => heightScale(d.gdp))
      .attr('fill', 'steelblue')
      .on('mouseover', (d) => {
        let rect = d3.event.target;
        d3.select(rect).attr('fill','#fecc00');
        clearTimeout(this.unsetHoverTimeout);
        const date = d3.timeFormat("%B %Y")(d.date);
        tooltip.style('left', (d3.event.pageX + 5) + "px")
          .style('top', (d3.event.pageY - 55) + "px")
          .html(`<p class="gdp">${d.gdp.toFixed(2)}</p><p class="date">${date}</p>`)
          .transition()
          .duration(100)
          .style('opacity', 0.9);
      })
      .on('mouseout', () => {
        let rect = d3.event.target;
        d3.select(rect).attr('fill','steelblue');
        this.unsetHoverTimeout = setTimeout( () => {
            tooltip.transition()
              .duration(500)
              .style('opacity', 0)
          }, 200
        );
        // this.props.onRectOut();
      });
  };

});
