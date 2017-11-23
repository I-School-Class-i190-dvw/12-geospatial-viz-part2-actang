// For larger browser, we simply set up the whole frame as the window 
// width and height
var width = Math.max(960, window.innerWidth),
height = Math.max(500, window.innerHeight);

// Two variables that will be used for calculation
var pi = Math.PI;
tau = 2 * pi;


// make the scale so that we can focus on the area we want,
// translate the origin of the map to [0,0] as a start, 
var projection = d3.geoMercator()
    .scale(1 / tau) 
    .translate([0, 0]);

// create path generator
// set projection to created projection
var path = d3.geoPath()
    .projection(projection); 

// set up tile according to width and height
var tile = d3.tile()
    .size([width, height]);

var zoom = d3.zoom()
    .scaleExtent([
        1 << 11,  // bitwise operator
        1 << 24
    ])
    .on('zoom', zoomed); // Define a zoom listener that rerenders when zoom in

// Set up circles with radius as magnitude
var radius = d3.scaleSqrt().range([0, 10]);

var svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

var raster = svg.append('g');
var vector = svg.selectAll('path');

// load the geodata and set up radius scale domain
d3.json('data/earthquakes_4326_cali.geojson', function(error, geojson) {
    if (error) throw error;
    // console.log(geojson);
    radius.domain([0, d3.max(geojson.features, function(d) { return d.properties.mag; })]);

    // Set the radius used to display magnitude
    path.pointRadius(function(d) {
        return radius(d.properties.mag);
    });

    // Bind vector data in the regular way
    // vector = vector.datum(geojson);

    // Another way to bind data wihout highlight whole path together
    vector = vector.data(geojson.features)
                    .enter().append('path')
                    .attr('d', path)
                    .on('mouseover', function(d) { console.log(d); });

    // Set map projection to center of California
    var center = projection([-119.66, 37.414])

    // Define the operations under zoom
    svg.call(zoom)
        .call(
            zoom.transform,
            d3.zoomIdentity
                .translate(width / 2, height / 2)
                .scale(1 << 14)
                .translate(-center[0], -center[1])
        );
});


function zoomed() {
    var transform = d3.event.transform;
    // apply transformation attribute to tile function
    var tiles = tile
        .scale(transform.k)
        .translate([transform.x, transform.y])
        ();

    // console.log(transform.x, transform.y, transform.k);

    // update projection scale
    projection
        .scale(transform.k / tau)
        .translate([transform.x, transform.y]);

    // redraw the vector
    vector.attr('d', path);

    // update existing elements
    var image = raster
        .attr('transform', stringify(tiles.scale, tiles.translate))
        .selectAll('image')
        .data(tiles, function(d) { return d; });

    // remove old elements
    image.exit().remove();

    // load corersponding tile images of the map
    image.enter().append('image')
        .attr('xlink:href', function(d) {
            // return url to the image
            return 'http://' + 'abc'[d[1] % 3] + '.basemaps.cartocdn.com/rastertiles/voyager/' + 
                d[2] + "/" + d[0] + "/" + d[1] + ".png";
        })
        .attr('x', function(d) { return d[0] * 256; })
        .attr('y', function(d) { return d[1] * 256; })
        .attr('width', 256)
        .attr('height', 256);
}

// crea the helper function to turn scale into a string for transformation
function stringify(scale, translate) {
    var k = scale / 256,
        r = scale % 1 ? Number : Math.round;

    return `translate(${r(translate[0] * scale)}, ${r(translate[1] * scale)}) scale(${k})`;
}

