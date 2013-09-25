define(['backbone',
        'models/agencyModel'], function(Backbone, Agency){
    
    var AgencyCollection = Backbone.Collection.extend({

        model: Agency,

        url:'http://webservices.nextbus.com/service/publicXMLFeed?command=agencyList',

        initialize: function () {
            console.log('initializing new agency')
        },

        parse: function (response) {
            console.log(data)
            return data;
        }
    });

    return AgencyCollection;

});