requirejs.config({

        baseUrl: 'js',
    
    paths:{
        'text': 'vendor/text',
        'backbone': 'vendor/backbone',
        'underscore': 'vendor/underscore',
        'jquery': 'vendor/jquery',
        'jqueryui': 'vendor/jquery-ui'
        // 'jquery.customSelect': 'vendors/customSelect',
        // 'jquery.masonry': 'vendors/masonry',
    },

    shim:{

        'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone',
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

        'jquery':{
            exports: '$'
        },

        'jqueryui':{
            deps:['jquery']
        }
    }
});

requirejs(['app'], function(AppController){
    var ac = AppController();
});
