define(['text!templates/mapTemplate.html','backbone', 'd3', 'topojson', 'underscore', 'moment', 'jquery-ui'], 

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

            colorAssignments: {},

            colorAssignmentIndex: 0,

            neighborhoodIndex: 0,

            el: mapTemplate,

            tooltipTemplate: _.template('<table>' +
                                            '<tr><td>Bus Id: </td><td>{{ id }}</td></tr>' +
                                            '<tr><td>Route:</td><td>{{ route }}</td></tr>' +
                                            '<tr><td>Direction:</td><td>{{ direction }}</td></tr>' +
                                        '</table>'),

            stopTooltipTemplate: _.template('<table>' +
                                                '<tr><td colspan="2">{{ title }}</td></tr>' +
                                                '<tr><td>Stop Id: </td><td>{{ id }}</td></tr>' +
                                                '<tr><td colspan="2">Click for times</td></tr>' +
                                            '</table>'),

            events: {
                'click .magnify': 'onMagnifyClick',
                'click .retract': 'onRetractClick',
                'click .top': 'onTopClick',
                'click .right': 'onRightClick',
                'click .bottom': 'onBottomClick',
                'click .left': 'onLeftClick',
                'click .details .glyphicon-remove-circle': 'onDetailsCloseClick',
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
                this.zoomIn = _.bind(this.zoomIn, this)
                this.zoomOut = _.bind(this.zoomOut, this)
                this.zoomTo = _.bind(this.zoomTo, this)
                this.onBodyKeyup = _.bind(this.onBodyKeyup, this)
                this.onBusStopClick = _.bind(this.onBusStopClick, this)
                
                //Bind keyup for arrow events
                $('body').on('keyup', this.onBodyKeyup)

                this.zoomLevel = 0
                this.centered = null

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
                    .style('stroke', function (d) { 
                        return that.colorAssignments[d.properties.model.get('routeTag')] 
                    })
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
                    .data(this.currentPlot, function (d) { return d.title })

                plotRendering.enter().append('polygon')
                    .style('opacity', 0)
                    .each(function (d) {
                        $(this).data('plot', d)
                    })
                    .attr('points', function (d) { return d.points })
                    .attr('class', 'stop')
                    .on("click", this.onBusStopClick)

                plotRendering.transition().duration(this.transitionDuration)
                    .style('opacity', .8)
                    .each(function (d) {
                        $(this).data('stop', d)
                    })
                    .attr('points', function (d) { return d.points })

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

            setRouteColorAssignment: function (tag) {
                var color = this.neighborhoodColors[this.neighborhoodIndex]
                this.neighborhoodIndex = (this.neighborhoodIndex + 1 == this.neighborhoodColors.length ? 0 : this.neighborhoodIndex + 1)
                this.colorAssignments[tag] = color
            },

            getRouteColorAssignment: function (tag) {
                return this.colorAssignments[tag]
            },

            updateFooter: function () {
                this.$el.find('.current-bus-count').text(this.realVehicleData.length + ' vehicles currently in operation').fadeIn()
                this.$el.find('.update-time').text('Updated at ' + moment().format('h:mm:ss a')).fadeIn()
            },

            zoomOut: function () {
                if(this.zoomLevel <= 0){ return }
                if(this.zoomLevel == 1){
                    this.currentx = this.width / 2;
                    this.currenty = this.height / 2;
                }
                this.zoomLevel--
                this.k = this.zoomLevel == 0 ? 1 : this.zoomLevel * 2;
                this.centered = null;
                this.zoomed = false;

                this.translateMap()
            },

            zoomIn: function () {
                if(this.zoomLevel >= 3) { return }
                if(this.zoomLevel == 0){
                    this.currentx = this.width / 2;
                    this.currenty = this.height / 2;
                }
                this.zoomLevel++
                this.k = this.zoomLevel * 2
                this.translateMap()
            },

            zoomTo: function (d) {
                if(this.zoomLevel == 0){
                    this.zoomLevel = 1
                } else if (this.zoomLevel == 1){
                    this.zoomLevel = 2
                } else if (this.zoomLevel == 2){
                    this.zoomLevel = 3
                }
                this.k = this.zoomLevel * 2
                var centroid = this.path.centroid(d)
                this.currentx = centroid[0]
                this.currenty = centroid[1]
                this.centered = d
                this.translateMap()
            },

            moveMap: function (direction) {
                if(this.zoomLevel == 0){ return }
                if(direction == 'top'){
                    this.currenty -= 50
                } else if(direction == 'right'){
                    this.currentx += 50
                } else if(direction == 'bottom'){
                    this.currenty += 50
                } else if(direction == 'left'){
                    this.currentx -= 50
                }
                if(this.currentx < 0){
                    this.currentx = 0
                } else if (this.currentx > this.width){
                    this.currentx = this.width
                }
                if(this.currenty < 0){
                    this.currenty = 0
                } else if (this.currenty > this.height){
                    this.currenty = this.height
                }
                this.translateMap()
            },

            translateMap: function () {
                var that = this
                this.g.selectAll("path")
                    .classed("active", this.centered && function(d) { return d === that.centered; });

                this.g.transition()
                    .duration(750)
                    .attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")scale(" + this.k + ")translate(" + -this.currentx + "," + -this.currenty + ")")
                    .style("stroke-width", 1.5 / this.k + "px");
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
                    if(stop.lon && stop.lat){

                        var coordinates = that.projection([parseFloat(stop.lon), parseFloat(stop.lat)])
                        var centerx = coordinates[0]
                        var centery = coordinates[1]
                        if(stop.title.toLowerCase().indexOf('inbound') != -1 || stop.title.toLowerCase().indexOf('ib') != -1){
                            centery -= 5
                        } else if (stop.title.toLowerCase().indexOf('outbound') != -1 || stop.title.toLowerCase().indexOf('ob') != -1){
                            centerx += 5
                        }
                        var radius = 4

                        var topx = centerx 
                        var topy = centery - radius

                        var toprightx = centerx + radius
                        var toprighty = centery - (radius/2)

                        var bottomrightx = centerx + radius
                        var bottomrighty = centery + (radius/2)

                        var bottomx = centerx
                        var bottomy = centery + radius

                        var bottomleftx = centerx - radius
                        var bottomlefty = centery + (radius/2)

                        var topleftx = centerx - radius
                        var toplefty = centery - (radius/2)

                        var string =    topx + ',' + topy + ' ' +
                                        toprightx + ',' + toprighty + ' ' +
                                        bottomrightx + ',' + bottomrighty + ' ' +
                                        bottomx + ',' + bottomy + ' ' +
                                        bottomleftx + ',' + bottomlefty + ' ' +
                                        topleftx + ',' + toplefty

                        that.currentPlot.push({
                            type: 'point',
                            points: string,
                            title: stop.title,
                            id: stop.stopId,
                            routeTag: model.get('tag')
                        })
                    }
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
                        route: model.get('routeTag'),
                        direction: model.get('direction')
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

            onBusStopClick: function (data) {
                this.options.appView.controlView.getBusStopDetails(data)
            },

            onStopMouseOver: function (evt) {
                var data = $(evt.target).data('stop')
                var position = $(evt.target).position()
                this.setTooltip(data, position.top, position.left, true)
            },

            onBodyKeyup: function (evt) {
                if(evt.keyCode == 38){
                    this.onTopClick()
                    evt.preventDefault()
                } else if (evt.keyCode == 39) {
                    this.onRightClick()
                    evt.preventDefault()
                } else if (evt.keyCode == 40) {
                    this.onBottomClick()
                    evt.preventDefault()
                } else if (evt.keyCode == 37) {
                    this.onLeftClick()
                    evt.preventDefault()
                }
            },

            onDetailsCloseClick: function () {
                this.details.slideUp()
            },

            onStopMouseout: function (evt) {
                this.destroyTooltip()
            },

            onElementClick: function (d) {
                this.zoomTo(d)
            },

            onMagnifyClick: function () {
                this.zoomIn()
            },

            onRetractClick: function () {
                this.zoomOut()
            },

            onTopClick: function () {
                this.moveMap('top')
            },

            onRightClick: function () {
                this.moveMap('right')
            },

            onBottomClick: function () {
                this.moveMap('bottom')
            },

            onLeftClick: function () {
                this.moveMap('left')
            }

        })

        return MapView
    }

);