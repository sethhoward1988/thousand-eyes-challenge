
define(['backbone', 'collections/vehicleCollection'], function(Backbone, VehicleCollection){

    var Agency = Backbone.Model.extend({

        approvedAgencies: ['sf-muni', 'ucsf'],
        
        initialize: function () {
            if(_.indexOf(this.approvedAgencies, this.get('tag')) != -1 ){
                console.log('creating vehicle collection...')
                this.vehicleCollection = new VehicleCollection()
                this.vehicleCollection.setAgency(this)
                this.vehicleCollection.update()
            }
        }

    });

    return Agency;

});