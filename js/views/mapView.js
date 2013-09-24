define(['backbone', 'd3', 'topojson'], 

    function (Backbone, d3) {

        var MapView = Backbone.View.extend({

            transitionDuration: 500,
            width: 1000,
            height: 1160,
            neighborhoodColors: [
                '#ffdb8f',
                '#ebbbb1',
                '#daadd8',
                '#fffda6',
                '#6ea1d0',
                '#97c87d'
            ],
            neighborhoodIndex: 0,

            initialize: function () {
                this.setup()
                this.setData()
            },

            setup: function () {
                this.projection = d3.geo.mercator()
                    .center([-122.4383, 37.7350])
                    .scale((1 << 21) / 2 / Math.PI)
                    .translate([this.width / 2, this.height / 2]);

                this.path = d3.geo.path()
                    .projection(this.projection)

                this.svg = d3.select(this.el).append("svg")
                    .attr("width", this.width)
                    .attr("height", this.height)
                    
                this.streetVis = this.svg.append('g').attr('class','streets')
                this.neighborhoodVis = this.svg.append('g').attr('class','neighborhoods')
                this.freewayVis = this.svg.append('g').attr('class','freeways')
            },

            renderFreeway: function () {
                this.freeways = this.freewayVis.selectAll(".freeway")
                    .data(this.freewayData.features)

                this.freeways.enter().append("path")
                    .attr('class','freeway')
                    .attr("d", this.path)
            },

            renderStreets: function () {
                var that = this;
                this.streets = this.streetVis.selectAll('.street')
                    .data(this.streetData.features)

                this.streets.enter().append("path")
                    .attr('class','street')
                    .attr("d", function(d) {
                        d.geometry["type"] = "LineString"
                        return that.path(d) 
                    })
            },

            renderNeighborhood: function () {
                var that = this;
                this.neighborhoods = this.neighborhoodVis.selectAll(".neighborhood")
                    .data(this.neighborhoodData.features)

                this.neighborhoods.enter().append("path")
                    .attr('class','neighborhood')
                    .attr("d", this.path)
                    .style('fill', function (d) {
                        var color = that.neighborhoodColors[that.neighborhoodIndex]
                        that.neighborhoodIndex = (that.neighborhoodIndex + 1 == that.neighborhoodColors.length ? 0 : that.neighborhoodIndex + 1)
                        return color;
                    })
            },

            setData: function () {
                var that = this;

                d3.json("js/json/freeways.json", function(error, freeways) {
                    that.freewayData = freeways
                    that.renderFreeway()
                })

                d3.json("js/json/streets.json", function (error, streets) {
                    that.streetData = streets
                    that.renderStreets()
                })

                d3.json("js/json/neighborhoods.json", function (error, neighborhoods) {
                    that.neighborhoodData = neighborhoods
                    that.renderNeighborhood()
                })
            },

        })

        return MapView
    }

);