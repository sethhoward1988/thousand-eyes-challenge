define(['backbone',
        'models/agencyModel'], function(Backbone, Agency){
    
    var AgencyCollection = Backbone.Collection.extend({

        model: Agency,

        url:'http://webservices.nextbus.com/service/publicXMLFeed?command=agencyList',

        initialize: function () {
            console.log('initializing new agency')
        },

        parse: function (data) {
            var parsed = [];
            $(data).find('agency').each(function (index, agency) {
                parsed.push({
                    tag: $(agency).attr('tag'),
                    title: $(agency).attr('tag'),
                    regionTitle: $(agency).attr('tag')
                })
            });

            return parsed;
        },

        fetch: function (options) {
            options = options || {};
            options.dataType = "xml";
            return Backbone.Collection.prototype.fetch.call(this, options);
        }
    });

    return AgencyCollection;

});