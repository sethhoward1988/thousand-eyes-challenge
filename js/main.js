requirejs.config({

    baseUrl: 'js',
    
    paths:{
        'text': 'vendor/text',
        'backbone': 'vendor/backbone',
        'moment':'vendor/moment',
        'underscore': 'vendor/underscore',
        'jquery': 'vendor/jquery',
        'jquery-ui': 'vendor/jquery-ui',
        'bootstrap': 'vendor/bootstrap',
        'd3': 'vendor/d3',
        'topojson': 'vendor/topojson'
    },

    shim:{

        'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },

        'bootstrap': {
            deps: ['jquery']
        },

        'underscore':{
            exports: '_',
            init: function(){
                var underscore = window._
                underscore.templateSettings = {
                    interpolate : /\{\{([\s\S]+?)\}\}/g,
                    evaluate: /\<\@(.+?)\@\>/gim
                };
                return _;
            }
        },

        'd3':{
            exports: 'd3'
        },

        'topojson':{
            exports: 'topojson'
        },

        'jquery-ui':{
            deps: ['jquery']
        },

        'jquery':{
            exports: '$'
        }
    }
});

requirejs(['app'], function(AppController){
    var ac = AppController();
});
