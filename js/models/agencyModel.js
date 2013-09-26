
define(['backbone', 'collections/vehicleCollection', 'collections/routeCollection'], function(Backbone, VehicleCollection, RouteCollection){

    var Agency = Backbone.Model.extend({

        approvedAgencies: ['sf-muni'], // ucsf
        
        initialize: function () {
            if(_.indexOf(this.approvedAgencies, this.get('tag')) != -1 ){
                this.vehicleCollection = new VehicleCollection()
                this.vehicleCollection.setAgency(this)
                this.vehicleCollection.update()
            }
        }
    });

    return Agency;

});