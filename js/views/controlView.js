define(['backbone', 'text!templates/controlTemplate.html', 'views/controlRowView', 'collections/routeCollection'], 

    function (Backbone, controlTemplate, ControlRowView, RouteCollection) {

        var ControlView = Backbone.View.extend({

            el: controlTemplate,

            busStopDetailsTemplate: _.template('<table></table>'),

            events: {
                'keyup .filter-input': 'onFilterKeyup',
                'click .glyphicon-remove-circle': 'onClickDetailsClose'
            },

            rows: [],

            initialize: function () {
                this.render = _.bind(this.render, this)
                this.addRow = _.bind(this.addRow, this)
                this.onAllClick = _.bind(this.onAllClick, this)

                this.mapView = this.options.mapView

                this.list = this.$el.find('.route-list table tbody')
                this.details = this.$el.find('.details')

                // this.on('updateDetails', this.updateDetails)

                this.routeCollection = new RouteCollection()
                this.routeCollection.setURL('sf-muni')
                this.routeCollection.fetch()

                this.routeCollection.on('add', this.render)
                this.render()
            },

            render: function () {
                var that = this

                $('input.all').off('click')
                this.list.empty()
                var input = $('<input type="checkbox" class="all">')
                input.on('click', this.onAllClick)
                var row = $('<tr><td></td><td colspan="3">All</td></tr>')
                $(row.find('td')[0]).append(input)
                this.list.append(row)
                this.routeCollection.each(function(route){
                    that.addRow(route)
                })
            },

            addRow: function (route) {
                var rowView = new ControlRowView({model:route, mapView: this.mapView})
                this.rows.push(rowView)
                this.list.append(rowView.$el)
            },

            getBusStopDetails: function (data) {
                var that = this
                this.details.slideDown(2000, 'easeOutBounce')
                $.ajax({
                    url:'http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=sf-muni&stopId=' + data.id + '&routeTag=' + data.routeTag,
                    dataType: "xml",
                    type: 'get',
                    success: function (resp) {
                        var response = []
                        _.each($(resp).find('direction'), function (direction){
                            var times = []
                            _.each($(direction).find('prediction'), function (prediction) {
                                times.push(moment(parseFloat($(prediction).attr('epochTime'))))
                            })
                            response.push({
                                title: $(direction).attr('title'),
                                times: times
                            })
                        })
                        that.populateDetailsPane(response, data)
                    },
                    error: function () {
                        alert("Server didn't respond, can't get stop information")
                    }
                })
            },

            populateDetailsPane: function (response, data) {
                var container = $('<div></div>')
                var title = $('<h3></h3>').text(data.title)
                container.append(title)
                _.each(response, function (direction) {
                    var directionHTML = $('<div></div>')
                    var header = $('<h4></h4>').text(direction.title ? direction.title + ' Times' : 'Times')
                    directionHTML.append(header)
                    _.each(direction.times, function (time){
                        var time = $('<span></span>').text(time.format('h:mm:ss a'))
                        directionHTML.append(time)
                    })
                    container.append(directionHTML)
                })
                this.details.find('.window').empty().append(container)
            },

            onFilterKeyup: function (evt) {
                var rows = this.$el.find('.route-row')
                var term = $(evt.target).val().toLowerCase()
                _.each(rows, function (row) {
                    row = $(row)
                    route = (row.find('.tag').text() + ' ' + row.find('.title').text()).toLowerCase()
                    if(route.indexOf(term) == -1){
                        row.hide()
                    } else {
                        row.show()
                    }
                })
            },

            onAllClick: function (evt) {
                checked = $(evt.target).prop('checked')
                _.each(this.rows, function (row) {
                    row.toggleCheck(checked)
                })
            },

            onClickDetailsClose: function () {
                this.details.stop(true).slideUp()
            }

        })

        return ControlView
    }

);