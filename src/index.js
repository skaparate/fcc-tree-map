import "./styles.css";
import * as d3 from "d3";

localStorage.setItem("project_selector", "tree-map");
const padding = 80;
const width = 1280;
const height = 800;
const body = d3.select("body");
const wrapper = body.append("div").attr("class", "wrapper");
const jsonURI =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/kickstarter-funding-data.json";

const tooltip = wrapper
  .append("div")
  .attr("id", "tooltip")
  .attr("class", "tooltip");

wrapper
  .append("h1")
  .text("Kickstarter Funding")
  .attr("id", "title")
  .style("text-align", "center");

wrapper
  .append("h2")
  .text("The most funded kickstarter projects")
  .attr("id", "description")
  .style("text-align", "center");

/**
 * Retrieves a constrasting color from another.
 * Source: https://24ways.org/2010/calculating-color-contrast/
 * @param {string} hexcolor The color to find its contrast.
 */
function getContrastYIQ(hexcolor) {
  const color = hexcolor.substring(1);
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "black" : "white";
}

function drawLegend(svg, categories, colors) {
  console.debug(categories);
  const colNum = 4;
  const legendW = width / colNum;
  const sqSize = 15;
  const itemPerCol = Math.ceil(categories.length / colNum);
  console.debug("Items per col:", itemPerCol, legendW);

  const group = svg
    .append("g")
    .attr("id", "legend")
    .attr("transform", `translate(0, ${height - 10})`);

  const legendItem = group
    .selectAll(".legend-item-group")
    .data(categories)
    .enter()
    .append("g")
    .attr("class", "legend-item-group")
    .attr("transform", (d, i) => {
      const mod = i % itemPerCol;
      const div = Math.floor(i / itemPerCol);
      return `
        translate(${div * legendW}, ${(mod * sqSize) + mod * 2})
        `;
    })
    .attr("width", legendW)
    .attr("height", sqSize + 2);

  legendItem
    .append("rect")
    .attr("width", sqSize)
    .attr("height", sqSize)
    .attr('class', 'legend-item')
    .attr("fill", d => colors(d));

  legendItem
    .append("text")
    .attr("class", "legend-text")
    .attr("transform", (d, i) => {
      const mod = i % itemPerCol;
      const div = Math.floor(i / itemPerCol);
      return `
      translate(${sqSize + 5}, 10)
      `;
    })
    .style('font-size', '10px')
    .text(d => d);
}

d3.json(jsonURI).then(response => {
  function onMouseMove(d) {
    const target = d3.select(d3.event.target);
    target.attr("stroke", "black");
    const bgColor = colors(d.parent.data.name);
    const contrast = getContrastYIQ(bgColor);
    tooltip
      .style("opacity", 0.9)
      .html(
        `
              ${d.data.name}<br />
              Category: ${d.data.category}<br />
              Value: ${d.data.value}
            `
      )
      .style("left", `${d3.event.pageX + 10}px`)
      .style("top", `${d3.event.pageY - 50}px`)
      .style("background-color", bgColor)
      .style("color", contrast)
      .style("border", `1px solid ${contrast}`)
      .attr("data-value", d.data.value);
  }

  const colorData = [...d3.schemeRdYlBu[7]];
  colorData.push(...d3.schemePRGn[11]);
  const colors = d3
    .scaleOrdinal()
    .domain(d3.range(18))
    .range(colorData);
  const svg = wrapper
    .append("svg")
    .attr("width", width + padding)
    .attr("height", height + padding)
    .style("display", "block")
    .style("margin", "0 auto");

  const root = d3.hierarchy(response).sum(d => d.value);
  d3
    .treemap()
    .size([width, height - 30])
    .paddingTop(28)
    .paddingRight(15)
    .paddingInner(3)(root);

  // The actual representation
  const cell = svg
    .selectAll(".cell")
    .data(root.leaves())
    .enter()
    .append("g")
    .attr("class", "cell")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .on("mousemove", onMouseMove)
    .on("mouseout", d => {
      const target = d3.select(d3.event.target);
      target.attr("stroke", "");
      tooltip.style("opacity", 0);
    });

  cell
    .append("rect")
    .attr("class", "tile")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("data-name", d => d.data.name)
    .attr("data-value", d => d.data.value)
    .attr("data-category", d => d.data.category)
    .style("stroke", "#d34e24")
    .style("fill", d => colors(d.parent.data.name));

  cell
    .append("foreignObject")
    .attr("class", "foreignObject")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .append("xhtml:body")
    .attr("class", "labelbody")
    .append("div")
    .attr("class", "label")
    .text(d => d.data.name)
    .attr("text-anchor", "middle")
    .style("color", d => {
      const bg = colors(d.parent.data.name);
      return getContrastYIQ(bg);
    });

  // Add titles to each category
  //   svg
  //     .selectAll(".category-name")
  //     .data(root.descendants().filter(d => d.depth === 1))
  //     .enter()
  //     .append("text")
  //     .attr("class", "category-name")
  //     .attr("x", d => d.x0)
  //     .attr("y", d => d.y0 + 21)
  //     .text(d => d.data.name)
  //     .attr("font-size", "14px")
  //     .attr("fill", d => colors(d.data.name));

  drawLegend(svg, response.children.map(i => i.name), colors);
});
