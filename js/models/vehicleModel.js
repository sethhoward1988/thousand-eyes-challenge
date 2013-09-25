
define(['backbone'], function(Backbone){

    var Vehicle = Backbone.Model.extend({
        
        initialize: function () {
            this.update = _.bind(this.update, this)
            this.on('change', this.update)
            this.update()
        },

        update: function () {
            this.set('feature', {
                type: "Feature",
                properties: { model: this },
                geometry: { 
                    type: "Point",
                    coordinates: [parseFloat(this.get('lon')), parseFloat(this.get('lat'))]
                }
            })
        }

    });

    return Vehicle;

});