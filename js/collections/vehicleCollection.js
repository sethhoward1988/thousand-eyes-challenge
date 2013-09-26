define(['backbone',
        'models/vehicleModel',
        'underscore'], function(Backbone, Vehicle){
    
    var VehicleCollection = Backbone.Collection.extend({

        model: Vehicle,

        initialize: function () {
            this.update = _.bind(this.update, this)
            this.mapData = []
        },

        update: function () {
            var that = this
            this.fetch()
            setTimeout(that.update, 15000)
        },

        setAgency: function (agency) {
            this.agency = agency
        },

        setURL: function () {
            this.url = 'http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=' + this.agency.get('tag') + '&t=' + (+new Date() - 60000)
        },

        parse: function (data) {
            console.log("collection length: " + this.models.length)
            var that = this;
            var parsed = []
            $(data).find('vehicle').each(function (index, vehicle) {
                parsed.push({
                    id: $(vehicle).attr('id'),
                    routeTag: $(vehicle).attr('routeTag'),
                    dirTag: $(vehicle).attr('dirTag'),
                    lat: $(vehicle).attr('lat'),
                    lon: $(vehicle).attr('lon'),
                    speedKmHr: $(vehicle).attr('speedKmHr') || 'N/A',
                    passengerCount: $(vehicle).attr('passengerCount') || 'N/A'
                })
            });
            return parsed;
        },

        fetch: function (options) {
            this.setURL()
            options = options || {};
            options.dataType = "xml";
            return Backbone.Collection.prototype.fetch.call(this, options);
        }
    });

    return VehicleCollection;

});