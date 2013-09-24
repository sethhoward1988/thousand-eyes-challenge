define(['backbone',
        'models/vehicleModel'], function(Backbone, Vehicle){
    
    var VehicleCollection = Backbone.Collection.extend({

        model: Vehicle,

        url:'/profiles.json',

        initialize: function () {

        }
    });

    return VehicleCollection;

});