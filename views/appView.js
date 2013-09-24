define([], 

        function () {

            var AppView = Backbone.View.extend({

                id:'app',

                initialize: function() {

                    console.log('application is now running...')
                    // this.profileCollection = new ProfileCollection();
                    // this.profileCollection.fetch({
                    //     success: _.bind(function(){
                    //         this.render();
                    //     }, this)
                    // });
                    // // this.render();
                },

                render: function () {

                    // this.sideBarView = new SideBarView({ appView: this });
                    // this.headerView = new HeaderView({ appView: this });
                    // this.masonView = new MasonView({collection: this.profileCollection, appView: this });

                    // this.$el.append(this.headerView.$el);
                    // this.$el.append(this.sideBarView.$el);
                    // this.$el.append(this.masonView.$el);

                    // $('body').append(this.$el);
                }

            });

            return AppView;

});