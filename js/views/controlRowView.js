define(['backbone', 'text!../templates/routeRowTemplate.html',], 

    function (Backbone, rowTemplate) {

        var ControlRowView = Backbone.View.extend({

            tagName: 'tr',

            className: 'route-row',

            template: _.template(rowTemplate),

            events: {
                'change .display-checkbox': 'onCheckboxChange',
                'click .plot': 'onPlotClick'
            },

            initialize: function () {
                this.$el.addClass(this.className)
                this.model = this.options.model
                this.mapView = this.options.mapView
                this.onCheckboxChange = _.bind(this.onCheckboxChange, this)
                this.render()
            },

            render: function () {
                this.$el.empty()
                this.$el.append(this.template({
                    tag: this.model.get('tag'),
                    title: this.model.get('title').replace(this.model.get('tag') + '-', '')
                }))
            },

            onCheckboxChange: function (evt) {
                this.mapView.filterRoute(this.model.get('tag'), this.$el.find('.display-checkbox').prop('checked'))
            },

            onPlotClick: function () {
                var button = this.$el.find('.plot')
                if(button.hasClass('active')){
                    this.mapView.clearPlot()
                    button.removeClass('active')
                    return
                }
                $('.plot').removeClass('active')
                var that = this
                var model = this.model
                button.addClass('active')
                model.getRoute(function () {
                    that.mapView.plotRoute(model)
                })
            },

            toggleCheck: function (checked) {
                this.$el.find('.display-checkbox').prop('checked', checked);
                this.onCheckboxChange()
            }

        })

        return ControlRowView

})