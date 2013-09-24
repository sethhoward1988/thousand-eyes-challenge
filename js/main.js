requirejs.config({
    
    paths:{
        'text': 'js/vendor/text',
        'backbone': 'js/vendor/backbone',
        'underscore': 'js/vendor/underscore',
        'jquery': 'js/vendor/jquery',
        'jqueryui': 'js/vendor/jquery-ui'
        // 'jquery.customSelect': 'vendors/customSelect',
        // 'jquery.masonry': 'vendors/masonry',
    },

    shim:{

        'underscore':{
            exports: '_',
            init: function(){
                var underscore = window._
                underscore.templateSettings = {
                    interpolate : /\{\{([\s\S]+?)\}\}/g,
                    evaluate: /\<\@(.+?)\@\>/gim
                };
                
            }
        }
    }
});

require(['appController'], function(AppController){
    var ac = AppController();
});