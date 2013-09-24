define(['backbone',
        'views/controlView',
        'views/mapView'
    ], 

    function (Backbone, ControlView, MapView) {

        var AppView = Backbone.View.extend({

            id:'app',

            initialize: function() {
                console.log('application is now running...')
                this.render();
            },

            render: function () {
                console.log('Rendering...')
                this.controlView = new ControlView({ appView: this })
                this.mapView = new MapView({ appView: this })

                this.$el.append(this.controlView.$el)
                this.$el.append(this.mapView.$el)

                $('body').append(this.$el)
            }

        });

        return AppView;

});