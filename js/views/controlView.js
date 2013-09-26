define(['backbone', 'text!templates/controlTemplate.html', 'views/controlRowView', 'collections/routeCollection'], 

    function (Backbone, controlTemplate, ControlRowView, RouteCollection) {

        var ControlView = Backbone.View.extend({

            el: controlTemplate,

            events: {
                'keyup .filter-input': 'onFilterKeyup'
            },

            rows: [],

            initialize: function () {
                this.render = _.bind(this.render, this)
                this.addRow = _.bind(this.addRow, this)
                this.onAllClick = _.bind(this.onAllClick, this)

                this.mapView = this.options.mapView

                this.list = this.$el.find('.route-list table tbody')

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

            onFilterKeyup: function (evt) {
                console.log('filter keying up')
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
            }

        })

        return ControlView
    }

);