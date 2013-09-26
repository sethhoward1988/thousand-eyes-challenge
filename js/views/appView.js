define(['backbone',
        'views/controlView',
        'views/mapView',
        'collections/agencyCollection'
    ], 

    function (Backbone, ControlView, MapView, AgencyCollection) {

        var AppView = Backbone.View.extend({

            el: '#app',

            initialize: function() {
                this.$el.addClass('container')
                this.render();
            },

            render: function () {
                this.agencyCollection = new AgencyCollection()

                this.mapView = new MapView({ appView: this, agencyCollection: this.agencyCollection })
                this.controlView = new ControlView({ appView: this, agencyCollection: this.agencyCollection, mapView: this.mapView })
                
                this.mapView.setupAgencies(this.agencyCollection)
                this.agencyCollection.fetch()

                this.$el.append(this.controlView.$el)
                this.$el.append(this.mapView.$el)
            }

        });

        return AppView;

});