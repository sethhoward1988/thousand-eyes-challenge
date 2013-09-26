define(['text!templates/mapTemplate.html','backbone', 'd3', 'topojson', 'underscore', 'moment'], 

    function (mapTemplate) {

        var MapView = Backbone.View.extend({

            transitionDuration: 1000,
            width: 600,
            height: 600,
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

            el: mapTemplate,

            tooltipTemplate: _.template('<table>' +
                                            '<tr><td>Bus Id: </td><td>{{ id }}</td></tr>' +
                                            '<tr><td>Route:</td><td>{{ route }}</td></tr>' +
                                        '</table>'),

            stopTooltipTemplate: _.template('<table>' +
                                                '<tr><td colspan="2">{{ title }}</td></tr>' +
                                                '<tr><td>Stop Id: </td><td>{{ id }}</td></tr>' +
                                            '</table>'),

            events: {
                'click .magnify': 'onMagnifyClick',
                'click .retract': 'onRetractClick',
                'click .top': 'onTopClick',
                'click .right': 'onRightClick',
                'click .bottom': 'onBottomClick',
                'click .left': 'onLeftClick',
                'mouseover .vehicle': 'onVehicleMouseOver',
                'mouseout .vehicle': 'onVehicleMouseout',
                'mouseover .stop': 'onStopMouseOver',
                'mouseout .stop': 'onStopMouseout'
            },

            routes: [],

            initialize: function () {
                this.$el.css({width: this.width})
                this.setup()
                this.setData()
            },

            // Map Setup ----------------------------------------------------

            setup: function () {
                
                this.addAgency = _.bind(this.addAgency, this)
                this.renderVehicles = _.chain(this.renderVehicles).bind(this).debounce(250).value()
                this.getVehicleData = _.debounce(this.getVehicleData, 250)
                this.onElementClick = _.bind(this.onElementClick, this)

                this.zoomed = false;

                this.centered = null;

                this.projection = d3.geo.mercator()
                    .center([-122.4358, 37.770])
                    .scale(210000)
                    // .scale((1 << 22) / 2 / Math.PI)
                    .translate([this.width / 2, this.height / 2])

                this.translation = this.projection.translate()
                this.scale = this.projection.scale()

                this.path = d3.geo.path()
                    .projection(this.projection)

                this.tooltip = $('<div class="tooltip"></div>')
                this.$el.find('.svg-container').append(this.tooltip)

                this.$el.find('.svg-container').css({width: this.width, height: this.height})

                this.svg = d3.select(this.$el.find('.svg-container')[0]).append("svg")
                    .attr("width", this.width)
                    .attr("height", this.height)

                this.svg.append("rect")
                    .attr("class", "background")
                    .attr("width", this.width)
                    .attr("height", this.height)
                    .on("click", this.onElementClick);

                this.g = this.svg.append('g')
            },

            setupAgencies: function (agencyCollection) {
                this.agencyCollection = agencyCollection
                this.agencyCollection.on('add', this.addAgency)
            },


            // Rendering Methods ----------------------------------------------------

            render: function () {
                var that = this;

                this.g.append("g")
                      .attr("class", "streets")
                    .selectAll("path")
                      .data(topojson.feature(this.data, this.data.objects.streets).features)
                    .enter().append("path")
                        .attr('class','street')
                        .attr("d", this.path)

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

                this.g.append("g").attr('class','neighborhoods')
                    .selectAll('path')
                        .data(topojson.feature(this.data, this.data.objects.neighborhoods).features)
                    .enter().append('path')
                        .each(function (d) {
                            $(this).data(d)
                        })
                        .attr("class", "neighborhood")
                        .attr("d", this.path)
                        .style('fill', function (d) {
                            var color = that.neighborhoodColors[that.neighborhoodIndex]
                            that.neighborhoodIndex = (that.neighborhoodIndex + 1 == that.neighborhoodColors.length ? 0 : that.neighborhoodIndex + 1)
                            return color;
                        })
                        .on("click", this.onElementClick);
                
                // Needs to be created here so that vehicles appear on top of everything
                this.plot = this.g.append('g').attr('class', 'route-plot')

                this.renderVehicles()
            },

            renderVehicles: function () {
                var that = this
                
                that.setVehicleData()

                if(!this.vehicles) {
                    this.vehicles = this.g.append('g').attr('class', 'vehicles')
                }

                var vehicleRendering = this.vehicles.selectAll('.vehicle')
                    .data(this.realVehicleData, function (d) { 
                        return d.id
                    })

                vehicleRendering.enter().append('circle')
                    .style('opacity', 0)
                    .each(function (d) {
                        $(this).data('vehicle', d)
                    })
                    .attr('class', 'vehicle')
                    .attr('cx', function (d) { return that.projection(d.geometry.coordinates)[0] })
                    .attr('cy', function (d) { return that.projection(d.geometry.coordinates)[1] })
                    .attr('r', 3)
                    .on("click", this.onElementClick)

                vehicleRendering.transition().duration(this.transitionDuration)
                    .style('opacity', 1)
                    .attr('cx', function (d) { return that.projection(d.geometry.coordinates)[0] })
                    .attr('cy', function (d) { return that.projection(d.geometry.coordinates)[1] })

                vehicleRendering.exit().transition().duration(this.transitionDuration)
                    .style('opacity', 0)
                    .remove()

                this.updateFooter()
            },

            renderPlot: function () {
                var that = this

                var plotRendering = this.vehicles.selectAll('.stop')
                    .data(this.currentPlot)

                plotRendering.enter().append('circle')
                    .style('opacity', 0)
                    .each(function (d) {
                        $(this).data('plot', d)
                    })
                    .attr('class', 'stop')
                    .attr('cx', function (d) { return d.x })
                    .attr('cy', function (d) { return d.y })
                    .attr('r', 3)
                    .on("click", this.onElementClick)

                plotRendering.transition().duration(this.transitionDuration)
                    .style('opacity', 1)
                    .each(function (d) {
                        $(this).data('stop', d)
                    })
                    .attr('cx', function (d) { return d.x })
                    .attr('cy', function (d) { return d.y })

                plotRendering.exit().transition().duration(this.transitionDuration)
                    .style('opacity', 0)
                    .remove()

                this.updateFooter()
            },

            

            // Util Methods ----------------------------------------------------

            addAgency: function (agency) {
                var that = this
                if(agency.vehicleCollection){
                    agency.vehicleCollection.on('change', function (collection) {
                        that.renderVehicles()
                    })
                }
            },
            
            setData: function () {
                var that = this;

                this.vehicleData = {}

                d3.json("js/json/sanfrancisco.json", function (error, sanfrancisco) {
                    that.data = sanfrancisco
                    that.render()
                })
            },

            setVehicleData: function () {
                var that = this;
                var updateTime = +new Date()
                this.realVehicleData = []

                this.agencyCollection.each(function (agency) {
                    if(agency.vehicleCollection){
                        agency.vehicleCollection.each(function(vehicle){
                            var feature = vehicle.get('feature')
                            if(_.indexOf(that.routes, vehicle.get('routeTag')) != -1){
                                that.realVehicleData.push(vehicle.get('feature'))
                            }
                        })
                    }
                })
                
            },

            updateFooter: function () {
                this.$el.find('.current-bus-count').text(this.realVehicleData.length + ' vehicles currently in operation').fadeIn()
                this.$el.find('.update-time').text('Updated at ' + moment().format('h:mm:ss a')).fadeIn()
            },

            zoom: function (d, retract, direction) {
                var x, y, k = 6, that = this;

                if(retract){
                    this.currentx = this.width / 2;
                    this.currenty = this.height / 2;
                    k = 1;
                    this.centered = null;
                    this.zoomed = false;
                }

                if (d && this.centered !== d) {
                    this.zoomed = true;
                    var centroid = this.path.centroid(d);
                    this.currentx = centroid[0];
                    this.currenty = centroid[1];
                    this.centered = d;
                }

                if(this.zoomed && direction){
                    if(direction == 'top'){
                        this.currenty -= 50
                    } else if(direction == 'right'){
                        this.currentx += 50
                    } else if(direction == 'bottom'){
                        this.currenty += 50
                    } else if(direction == 'left'){
                        this.currentx -= 50
                    }
                }

                this.g.selectAll("path")
                    .classed("active", this.centered && function(d) { return d === that.centered; });

                this.g.transition()
                    .duration(750)
                    .attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")scale(" + k + ")translate(" + -this.currentx + "," + -this.currenty + ")")
                    .style("stroke-width", 1.5 / k + "px");
            },

            filterRoute: function (tag, include) {
                if(include){
                    this.routes = _.union(this.routes, [tag])
                } else {
                    var index = _.indexOf(this.routes, tag)
                    this.routes.splice(index, 1)
                }
                this.renderVehicles()
            },

            plotRoute: function (model) {
                var that = this
                this.currentPlot = []
                
                _.each(model.stops, function (stop) {
                    var coordinates = that.projection([parseFloat(stop.lon), parseFloat(stop.lat)])
                    that.currentPlot.push({
                        type: 'point',
                        x: coordinates[0],
                        y: coordinates[1],
                        title: stop.title,
                        id: stop.stopId
                    })
                })

                this.renderPlot()
            },

            clearPlot: function () {
                this.currentPlot = []
                this.renderPlot()
            },

            setTooltip: function (model, top, left, stop) {
                var that = this;
                this.tooltip.empty()

                if(stop){
                    this.tooltip.append(this.stopTooltipTemplate({
                        title: model.title,
                        id: model.id
                    }))
                } else {
                    this.tooltip.append(this.tooltipTemplate({
                        id: model.get('id'),
                        route: model.get('routeTag')
                    }))
                }

                top -= this.tooltip.height() + 20
                left += 15

                if(this.tooltip.css('opacity') == 0){
                    // If it's totally faded out, let's move it so the next fade in doesn't
                    // look so dramatic
                    this.tooltip.css({
                        zIndex: 1,
                        top: top - 50,
                        left: left + 50
                    })
                }
                
                this.tooltip.stop(true)
                this.tooltip.animate({
                    top: top,
                    left: left,
                    opacity: 1
                })
            },

            destroyTooltip: function () {
                var position = this.tooltip.position()
                this.tooltip.animate({
                    opacity: 0,
                    zIndex: 0,
                    top: position.top - 50,
                    left: position.left + 50
                })
            },

            // UI EVENTS ----------------------------------------------------

            onVehicleMouseOver: function (evt) {
                var model = $(evt.target).data('vehicle').properties.model
                var position = $(evt.target).position()
                this.setTooltip(model, position.top, position.left)
            },

            onVehicleMouseout: function (evt) {
                this.destroyTooltip()
            },

            onStopMouseOver: function (evt) {
                var data = $(evt.target).data('stop')
                var position = $(evt.target).position()
                this.setTooltip(data, position.top, position.left, true)
            },

            onStopMouseout: function (evt) {
                this.destroyTooltip()
            },

            onElementClick: function (d) {
                this.zoom(d)
            },

            onMagnifyClick: function () {
                var neighborhoods = $('.neighborhood')
                var d = $(neighborhoods[Math.round(neighborhoods.length / 2)]).data()
                this.zoom(d)
            },

            onRetractClick: function () {
                this.zoom(false, true)
            },

            onTopClick: function () {
                this.zoom(false, false, 'top')
            },

            onRightClick: function () {
                this.zoom(false, false, 'right')
            },

            onBottomClick: function () {
                this.zoom(false, false, 'bottom')
            },

            onLeftClick: function () {
                this.zoom(false, false, 'left')
            }

        })

        return MapView
    }

);