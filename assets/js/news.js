/*
    Note: this file was updated on June 19th 2011, to reflect
    changes in the Facebook API, so some lines differ from those
    in the tutorial.
*/

$(document).ready(function(){

    // Calling our plugin with a page id:
    $('#news').facebookWall({
        id:'fumacapreta',
        access_token:'385118944977930|6qwIQ5FJB3TE9OfrcRQYg82Rg8E'
    });
    $('#tour-dates').facebookEvents({
        id:'fumacapreta',
        access_token:'385118944977930|6qwIQ5FJB3TE9OfrcRQYg82Rg8E'
    });

});

(function($){

    $.fn.facebookEvents = function(options){
        
        options = options || {};
        
        options = $.extend({
            limit: 50
        },options);

        var graphUSER = 'https://graph.facebook.com/'+options.id+'/?fields=name,picture&access_token='+options.access_token+'&callback=?',
            graphEVENTS = 'https://graph.facebook.com/'+options.id+'/events/?access_token='+options.access_token+'&callback=?&date_format=U&limit='+options.limit;

        console.log(graphEVENTS);
        
        var timeline = this;
        
        $.when(
            $.getJSON(graphUSER),
            $.getJSON(graphEVENTS)).done(function(user,posts){
            
            var fb = {
                user : user[0],
                posts : []
            };



            $.each(posts[0].data,function(){

                var graphEVENT = 'https://graph.facebook.com/'+this.id+'?&access_token='+options.access_token+'&callback=?';

                $.getJSON(graphEVENT, $.proxy(function(data){
                    if (data.location === data.venue.city) {
                        this.that.location = data.description;
                    }
                    this.that.venue_city = data.venue.city;
                    this.that.venue_country = data.venue.country;
                    this.that.start_month = $.format.date(this.that.start_time, "MMM");
                    this.that.start_day = $.format.date(this.that.start_time, "dd");
                    fb.posts.push(this.that);
                    if (fb.posts.length == this.nrPosts) {
                        renderTourDates();
                    }
                }, {that: this, nrPosts: posts[0].data.length}));

            });

            function renderTourDates() {
                if (fb.posts.length !== 0) {
                    ordered_tour_dates = fb.posts.sort(function(x, y){
                        date1 = new Date(x.start_time);
                        date2 = new Date(y.start_time);
                        return date1 - date2;
                    })
                    var ul = $('<ul class="unstyled tour-dates-list">').appendTo(timeline);
                    $('#events-feed').tmpl(ordered_tour_dates).appendTo(ul);

                } else {
                    var emptylist = $('<div><p>No dates are scheduled right now</p></div>').appendTo(timeline);
                    $('#events-feed').tmpl(fb.posts).appendTo(emptylist);
                }
            }
        });
        
        return this;

    };
    
    $.fn.facebookWall = function(options){
        
        options = options || {};
        
        // Default options of the plugin:
        
        options = $.extend({
            limit: 50,  // You can also pass a custom limit as a parameter.
            maxitems: 5
        },options);

        // Putting together the Facebook Graph API URLs:

        var graphUSER = 'https://graph.facebook.com/'+options.id+'/?fields=name,picture&access_token='+options.access_token+'&callback=?',
            graphPOSTS = 'https://graph.facebook.com/'+options.id+'/posts/?access_token='+options.access_token+'&callback=?&date_format=U&limit='+options.limit;
        
        var wall = this;
        
        $.when(
            $.getJSON(graphUSER),
            $.getJSON(graphPOSTS)).done(function(user,posts){
            
            // user[0] contains information about the user (name and picture);
            // posts[0].data is an array with wall posts;
            
            var fb = {
                user : user[0],
                posts : []
            };

            var countPosts = 0;

            $.each(posts[0].data,function(){
                
                // We only show links and statuses from the posts feed:
                /*if((this.type != 'link' && this.type!='status')){
                    return true;
                }*/
                if(this.message && countPosts < options.maxitems) {
                    // Copying the user avatar to each post, so it is
                    // easier to generate the templates:
                    this.from.picture = fb.user.picture.data.url;
                    
                    // Converting the created_time (a UNIX timestamp) to
                    // a relative time offset (e.g. 5 minutes ago):
                    this.created_time = relativeTime(this.created_time*1000);
                    
                    // Converting URL strings to actual hyperlinks:
                    this.message = urlHyperlinks(this.message);

                    fb.posts.push(this);

                    countPosts++;
                }
            });

            // Rendering the templates:
            //$('#headingTpl').tmpl(fb.user).appendTo(wall);
            
            // Creating an unordered list for the posts:
            var ul = $('<ul class="unstyled news-list">').appendTo(wall);
            
            // Generating the feed template and appending:
            $('#news-feed').tmpl(fb.posts).appendTo(ul);
        });
        
        return this;

    };

    // Helper functions:

    function urlHyperlinks(str){
        return str.replace(/\b((http|https):\/\/\S+)/g,'<a href="$1" target="_blank">$1</a>');
    }

    function relativeTime(time){
        
        // Adapted from James Herdman's http://bit.ly/e5Jnxe
        
        var period = new Date(time);
        var delta = new Date() - period;

        if (delta <= 10000) {   // Less than 10 seconds ago
            return 'Just now';
        }
        
        var units = null;
        
        var conversions = {
            millisecond: 1,     // ms -> ms
            second: 1000,       // ms -> sec
            minute: 60,         // sec -> min
            hour: 60,           // min -> hour
            day: 24,            // hour -> day
            month: 30,          // day -> month (roughly)
            year: 12            // month -> year
        };
        
        for (var key in conversions) {
            if (delta < conversions[key]) {
                break;
            }
            else {
                units = key;
                delta = delta / conversions[key];
            }
        }
        
        // Pluralize if necessary:
        
        delta = Math.floor(delta);
        if (delta !== 1) { units += 's'; }
        return [delta, units, "ago"].join(' ');
        
    }
    
})(jQuery);
