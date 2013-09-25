define(['backbone', 'd3', 'topojson', 'underscore'], 

    function () {

        var MapView = Backbone.View.extend({

            transitionDuration: 1000,
            width: 900,
            height: 900,
            neighborhoodColors: [
                '#ffdb8f',
                '#ebbbb1',
                '#daadd8',
                '#fffda6',
                '#6ea1d0',
                '#97c87d',
                '#9fe855',
                '#9e0e40',
                '#008080'
            ],
            neighborhoodIndex: 0,

            className: 'map',

            initialize: function () {
                this.$el.addClass(this.className)
                this.setup()
                this.setData()
            },

            setup: function () {
                
                this.addAgency = _.bind(this.addAgency, this)
                this.renderVehicles = _.chain(this.renderVehicles).bind(this).debounce(250).value()
                this.getVehicleData = _.debounce(this.getVehicleData, 250)
                this.clicked = _.bind(this.clicked, this)

                this.centered = null;

                this.projection = d3.geo.mercator()
                    .center([-122.4383, 37.760])
                    .scale(283772)
                    // .scale((1 << 22) / 2 / Math.PI)
                    .translate([this.width / 2, this.height / 2])

                this.translation = this.projection.translate()
                this.scale = this.projection.scale()

                this.path = d3.geo.path()
                    .projection(this.projection)

                this.svg = d3.select(this.el).append("svg")
                    .attr("width", this.width)
                    .attr("height", this.height)

                this.svg.append("rect")
                    .attr("class", "background")
                    .attr("width", this.width)
                    .attr("height", this.height)
                    .on("click", this.clicked);

                this.g = this.svg.append('g')
            },

            render: function () {
                var that = this;
                this.g.append("g")
                      .attr("class", "streets")
                    .selectAll("path")
                      .data(topojson.feature(this.data, this.data.objects.streets).features)
                    .enter().append("path")
                        .attr('class','street')
                        .attr("d", this.path)

                this.g.append("g").attr('class','neighborhoods')
                    .selectAll('path')
                        .data(topojson.feature(this.data, this.data.objects.neighborhoods).features)
                    .enter().append('path')
                        .attr("class", "neighborhood")
                        .attr("d", this.path)
                        .style('fill', function (d) {
                            var color = that.neighborhoodColors[that.neighborhoodIndex]
                            that.neighborhoodIndex = (that.neighborhoodIndex + 1 == that.neighborhoodColors.length ? 0 : that.neighborhoodIndex + 1)
                            return color;
                        })
                        .on("click", this.clicked);

                this.g.append("g").attr('class','freeways')
                    .selectAll('path')
                        .data(topojson.feature(this.data, this.data.objects.freeways).features)
                    .enter().append('path')
                        .attr("class", "freeway")
                        .attr("d", this.path)

                this.g.append("g").attr('class','arteries')
                    .selectAll('path')
                        .data(topojson.feature(this.data, this.data.objects.arteries).features)
                    .enter().append('path')
                        .attr("class", "artery")
                        .attr("d", this.path)

                this.setVehicleData()

                this.vehicles = this.g.append('g').attr('class', 'vehicles')
                    .selectAll('path')
                        .data(this.realVehicleData, function (d) { 
                            return d.properties.model.get('id')
                        })
                


            },

            clicked: function (d) {
                    var x, y, k, that = this;

                  if (d && this.centered !== d) {
                    var centroid = this.path.centroid(d);
                    x = centroid[0];
                    y = centroid[1];
                    k = 4;
                    this.centered = d;
                  } else {
                    x = this.width / 2;
                    y = this.height / 2;
                    k = 1;
                    this.centered = null;
                  }

                  this.g.selectAll("path")
                      .classed("active", this.centered && function(d) { return d === that.centered; });

                  this.g.transition()
                      .duration(750)
                      .attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
                      .style("stroke-width", 1.5 / k + "px");
            },

            setupAgencies: function (agencyCollection) {
                this.agencyCollection = agencyCollection
                this.agencyCollection.on('add', this.addAgency)
            },

            addAgency: function (agency) {
                var that = this
                if(agency.vehicleCollection){
                    agency.vehicleCollection.on('change', function (collection) {
                        that.setVehicleData()
                        that.renderVehicles()
                    })
                }
            },

            setVehicleData: function () {
                var that = this;
                this.agencyCollection.each(function (agency) {
                    if(agency.vehicleCollection){
                        agency.vehicleCollection.each(function(vehicle){
                            that.vehicleData[vehicle.get('id')] = vehicle.get('feature')
                        })
                    }
                })
                var data = []
                for(prop in that.vehicleData){
                    data.push(that.vehicleData[prop])
                }
                this.realVehicleData = data
                
            },

            renderVehicles: function () {
                var that = this
                    
                this.vehicles
                    .enter().append('g')
                        .each(function(){
                            $(this).append(
                                '<rect style="opacity:1;fill:#333333;fill-opacity:1;stroke:#000000;stroke-width:1;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" id="rect3165" width="6.2608695" height="10.92174" x="-9.6695652" y="20.591305" ry="3.1304348" transform="scale(-1,1)"/>' +
                                '<rect style="opacity:1;fill:#333333;fill-opacity:1;stroke:#000000;stroke-width:1;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" id="rect3167" width="6.2608695" height="10.92174" x="-28.765223" y="20.591305" ry="3.1304348" transform="scale(-1,1)"/>' +
                                '<path style="fill:#ff7c05;fill-opacity:1;stroke:#000000;stroke-width:1;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" d="M 7.7110875,1.3015295 L 23.245434,1.1623991 C 27.721268,1.1623991 30.489775,4.2787317 30.489775,8.7545661 L 30.768035,23.384564 C 30.768035,27.860399 27.651703,29.098471 23.175869,29.098471 L 8.824131,29.098471 C 4.3482966,29.098471 1.7189206,28.069095 1.7189206,23.59326 L 1.5102249,8.8241313 C 1.5102249,4.3482969 3.2352531,1.3015295 7.7110875,1.3015295 z" id="rect2383" sodipodi:nodetypes="ccccccccc"/>' +
                                '<path style="fill:#ffffff;fill-opacity:1;stroke:#000000;stroke-width:1;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1" d="M 7.0260868,4.4521737 C 11.809714,1.8057852 22.282712,2.2145298 25.113045,4.4521737 C 27.993838,6.342034 31.869013,16.047546 27.478262,17.87826 C 20.437994,20.548588 12.70158,18.895489 5.9130433,16.556522 C 1.0646445,14.802088 3.6236147,6.5654362 7.0260868,4.4521737 z" id="rect3169" sodipodi:nodetypes="ccccc"/>' +
                                '<path sodipodi:type="arc" style="opacity:1;fill:#ffffff;fill-opacity:1;stroke:#000000;stroke-width:1;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" id="path3172" sodipodi:cx="5.5999999" sodipodi:cy="22.608696" sodipodi:rx="2.2608695" sodipodi:ry="2.2956522" d="M 7.8608694,22.608696 A 2.2608695,2.2956522 0 1 1 3.3391304,22.608696 A 2.2608695,2.2956522 0 1 1 7.8608694,22.608696 z" transform="translate(2.3652174,-0.3478261)"/>' +
                                '<path sodipodi:type="arc" style="opacity:1;fill:#ffffff;fill-opacity:1;stroke:#000000;stroke-width:1;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" id="path3174" sodipodi:cx="22.504349" sodipodi:cy="23.443478" sodipodi:rx="2.4695652" sodipodi:ry="2.5739131" d="M 24.973914,23.443478 A 2.4695652,2.5739131 0 1 1 20.034784,23.443478 A 2.4695652,2.5739131 0 1 1 24.973914,23.443478 z"/>'
                            )
                        })
                        

                // this.vehicles.enter().append("div")
                //     .style('opacity', 0)
                //     .attr('class', 'vehicle')
                //     .each(function (d) {
                //         var coordinates = that.projection(d.geometry.coordinates)
                //         $(this).css({
                //             top: coordinates[1],
                //             left: coordinates[0],
                //         })
                //     })

                this.vehicles.exit().transition().duration(this.transitionDuration)
                    .style('opacity', 0)
                    .remove()
            },

            setData: function () {
                var that = this;

                this.vehicleData = {}

                d3.json("js/json/sanfrancisco.json", function (error, sanfrancisco) {
                    that.data = sanfrancisco
                    that.render()
                })
            },

        })

        return MapView
    }

);