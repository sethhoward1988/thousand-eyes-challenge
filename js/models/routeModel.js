
define(['backbone'], function(Backbone){

    var Route = Backbone.Model.extend({

        initialize: function () {
            
        },

        getRoute: function (success) {
            var that = this
            this.getRouteSuccess = success
            if(!this.stops){
                $.ajax({
                    dataType: "xml",
                    type: 'get',
                    url: "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=sf-muni&r=" + this.get('tag'),
                    success:function (response) {
                        that.onRouteFetchSuccess(response)
                    },
                    error: function () {
                        alert("Server didn't respond, can't plot this route")
                    }
                })
            } else {
                success()
            }
        },

        onRouteFetchSuccess: function (response, success) {
            //Set the proper route information so that it can be charted
            var that = this
            this.stops = []
            $(response).find('stop').each(function (index, stop) {
                stop = $(stop)
                that.stops.push({
                    title: stop.attr('title'),
                    lat: stop.attr('lat'),
                    lon: stop.attr('lon'),
                    stopId: stop.attr('stopId')
                })
            });
            this.getRouteSuccess()
        }

    });

    return Route;

});