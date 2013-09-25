define(['backbone',
        'views/controlView',
        'views/mapView',
        'collections/agencyCollection'
    ], 

    function (Backbone, ControlView, MapView, AgencyCollection) {

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

                this.agencyCollection = new AgencyCollection()
                this.agencyCollection.fetch()

                this.$el.append(this.controlView.$el)
                this.$el.append(this.mapView.$el)

                $('body').append(this.$el)
            }

        });

        return AppView;

});