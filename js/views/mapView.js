define(['backbone', 'd3', 'topojson', 'underscore'], 

    function () {

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
                '#97c87d',
                '#9fe855',
                '#9e0e40',
                '#008080'
            ],
            neighborhoodIndex: 0,

            initialize: function () {
                this.setup()
                this.setData()
            },

            setup: function () {
                this.redraw = _.bind(this.redraw, this)
                this.renderFreeways = _.bind(this.renderFreeways, this)
                this.projection = d3.geo.mercator()
                    .center([-122.4383, 37.7350])
                    .scale((1 << 21) / 2 / Math.PI)
                    .translate([this.width / 2, this.height / 2])

                this.translation = this.projection.translate()
                this.scale = this.projection.scale()

                this.path = d3.geo.path()
                    .projection(this.projection)

                this.svg = d3.select(this.el).append("svg")
                    .attr("width", this.width)
                    .attr("height", this.height)
                    .call(d3.behavior.zoom().on("zoom", this.redraw));
                    
                this.streetVis = this.svg.append('g').attr('class','streets')
                this.arteryVis = this.svg.append('g').attr('class','arteries')
                this.neighborhoodVis = this.svg.append('g').attr('class','neighborhoods')
                this.freewayVis = this.svg.append('g').attr('class','freeways')
            },

            render: function () {
                this.renderFreeways()
                this.renderNeighborhoods()
                // this.renderArteries()
                // this.renderStreetsForNeighborhood()
            },

            renderFreeways: function () {
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
                    .attr("d", this.path)
            },

            renderNeighborhoods: function () {
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

            renderArteries: function () {
                this.arteries = this.arteryVis.selectAll(".artery")
                    .data(this.arterialData.features)

                this.arteries.enter().append("path")
                    .attr('class','artery')
                    .attr("d", this.path)
            },

            redraw: function () {
                console.log('redrawing!')
                // d3.event.translate (an array) stores the current translation from the parent SVG element
              // t (an array) stores the projection's default translation
              // we add the x and y vales in each array to determine the projection's new translation
              var tx = this.translation[0] * d3.event.scale + d3.event.translate[0];
              var ty = this.translation[1] * d3.event.scale + d3.event.translate[1];
              this.projection.translate([tx, ty]);

              // now we determine the projection's new scale, but there's a problem:
              // the map doesn't 'zoom onto the mouse point'
              this.projection.scale(this.scale * d3.event.scale);

                // redraw the map
                this.streetVis.selectAll('path').attr('d', this.path);
                this.neighborhoodVis.selectAll('path').attr('d', this.path);
                this.freewayVis.selectAll('path').attr('d', this.path);
                this.arteryVis.selectAll('path').attr('d', this.path);
            },

            setData: function () {
                var that = this;

                // window.newStreets = {type:'FeatureCollection', features: []}
                // streetNames = []
                // d3.json("js/json/streets.json", function (error, streets) {
                //     console.log(streets)
                //     _.each(streets.features, function (street) {
                //         if(_.indexOf(streetNames, street.properties.STREETNAME) == -1){
                //             streetNames.push(street.properties.STREETNAME)
                //             var newProperties = { STREETNAME: street.properties.STREETNAME }
                //             street.properties = newProperties
                //             newStreets.features.push(street)
                //         }
                //     })
                //     console.log(newStreets)


                // })

                d3.json("js/json/sanfrancisco.json", function (error, sanfrancisco) {
                    that.freewayData = topojson.feature(sanfrancisco, sanfrancisco.objects.freeways);
                    that.neighborhoodData = topojson.feature(sanfrancisco, sanfrancisco.objects.neighborhoods);
                    that.streetData = topojson.feature(sanfrancisco, sanfrancisco.objects.streets);
                    that.arterialData = topojson.feature(sanfrancisco, sanfrancisco.objects.arteries);
                    that.render()
                })
            },

        })

        return MapView
    }

);