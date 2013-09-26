
define(['backbone'], function(Backbone){

    var Vehicle = Backbone.Model.extend({
        
        initialize: function () {
            this.update = _.bind(this.update, this)
            this.on('change', this.update)
            this.update()
        },

        update: function () {
            this.set('feature', {
                id: this.get('id'),
                type: "Feature",
                properties: { model: this },
                geometry: { 
                    type: "Point",
                    coordinates: [parseFloat(this.get('lon')), parseFloat(this.get('lat'))]
                }
            })
        },

        parse: function (data) {
            if(data.dirTag){
                data.direction = data.dirTag.toLowerCase().indexOf('ob') != -1 ? 'Outbound' : 'Inbound'    
            } else {
                data.direction = 'N/A'
            }
            
            return data
        }

    });

    return Vehicle;

});