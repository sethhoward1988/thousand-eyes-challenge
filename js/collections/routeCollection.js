define(['backbone',
        'models/routeModel'], function(Backbone, Route){
    
    var RouteCollection = Backbone.Collection.extend({

        model: Route,

        initialize: function () {
            console.log('initializing new route Collection')
        },

        setURL: function (agency) {
            this.url = 'http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=' + agency
        },

        parse: function (data) {
            var parsed = [];
            $(data).find('route').each(function (index, route) {
                parsed.push({
                    tag: $(route).attr('tag'),
                    title: $(route).attr('title')
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

    return RouteCollection;

});