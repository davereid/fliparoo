/*
  See README.md for information on usage
*/


jQuery.fliperoo = {version: '0.1'};

;(function($) { 
  jQuery.fn.fliperoo = function(stockpile, options) {  
    
    return this.each(function(index) {
    
      var unifiedList = false; // are the display and stockpile the same list?
    
      if ((typeof stockpile == 'undefined' && typeof options == 'undefined') || (typeof options == 'undefined' && (typeof stockpile[0] == 'undefined' || typeof stockpile[0].nodeName == 'undefined'))) {
        // if there are no arguments OR
        // if there's no second argument and the first isn't an HTML element
        // @todo find better test?
        options = stockpile;
        stockpile = {};
        unifiedList = true;
      }
    
      // set up the options, merging defaults, and any overrides from an external file
      var opts = $.extend({}, jQuery.fliperoo.defaults, jQuery.fliperoo.options, options);
      
      var displayItems = []; // list of elements to display in
      if (unifiedList && opts.displayCount) {
        // if it's a unified list and the display count is not 0
        $(this).children().each(function(i){
          if (i < opts.displayCount) {
            // add the first x elements to the displayItems array
            displayItems.push(this);
          }
          else {
            // hide the rest
            $(this).hide();
          }
        });
      }
      else {
        displayItems = $(this).children().toArray(); 
      }
      
      var displayIndex = 0; // index of next item to display in      
            
      //create array representing the order of display
      var displayOrder = [];
      for (var i=0; i<displayItems.length; i++) {
        displayOrder[i] = i;
      }

      if (opts.displayOrder == 'random') {
        displayOrder = shuffle(displayOrder);
      } else if (opts.displayOrder == 'reverse') {
        displayOrder = displayOrder.reverse();
      } else {
        // forward
        // do nothing - don't reorder 
      }
            
      // add copy of the display items to the end of the stock items array
      var stockItems = $(stockpile).children().toArray().concat($(this).children().clone().toArray());
      
      var stockIndex = 0; // the next item to pull from the stock pile
      if (unifiedList) {
        stockIndex = opts.displayCount;
      }
      
      // @todo: if we want to randomize, then shuffle stockpile, and swap out display items immediately
      if (opts.randomize) {
        stockItems = shuffle(stockItems);
      }
      // stockItems is an array of HTML elements in the order to be displayed
      
      // let's make some rotation values
      var rotateStyle = 'rotate' + opts.rotateStyle;
      var xyzVals;
      var rotation = {};
      var rotationCSS = {};
      if (opts.rotateStyle == 'XYZ') {
        //rotateStyle = 'rotate3d';
        xyzValues = opts.xyzValues + ',+=180deg'; // @BUG: it looks like rotate3d doesn't support relative rotation values
        rotation = {rotate3d: xyzValues};
        rotationCSS = {rotate3d: opts.xyzValues + ',180deg'};
      }
      else {
        rotation['rotate'+opts.rotateStyle] = opts.rotateDirection+'=180deg';
        rotationCSS['rotate'+opts.rotateStyle] = '180deg';
      }
      
      // let's start manipulating the HTML
      // add class to display container
      $(this).addClass('fliperoo-display-list');
      // then we wrap contents of each of the display elements
      $(displayItems).each(function(){
        if (opts.randomize) {
          // if we're random, then take the first items from the stockpile and stick 'em in before the page loads
          $(this).empty().append($(stockItems[stockIndex]).clone().contents());
          stockIndex = (stockIndex + 1) % (stockItems.length);
        }
        $(this).addClass('fliperoo-display-container').data('flipped', false).contents().wrapAll('<div class="fliperoo-display fliperoo-front" />');
        
        $('<div class="fliperoo-display fliperoo-back"></div>').appendTo(this).css(rotation);
      });
      
      function doNext() {
        // replace the display item with the stockpile item
        
        var dispCont = displayItems[displayOrder[displayIndex]]; // display container
        var flipped = $(dispCont).data('flipped');
        
        // change out the (current) back side
        var side = flipped ? '.fliperoo-front' : '.fliperoo-back';
        $(dispCont).children(side).empty().append($(stockItems[stockIndex]).clone().contents());
        
        // toggle flipped status on this element
        $(dispCont).data('flipped', !flipped);
        
        var transition = $.extend({}, {perspective: opts.perspective}, rotation);
        
        if (opts.flipFlop && opts.rotateStyle != 'XYZ'){
          //toggle direction
          if (rotation['rotate'+opts.rotateStyle] == '+=180deg') {
            rotation['rotate'+opts.rotateStyle] = '-=180deg';
          } else {
            rotation['rotate'+opts.rotateStyle] = '+=180deg';
          }
        }
        
        if (opts.rotateStyle == 'XYZ') {
          console.log(transition);
        }
        
        // then turn it 180 degrees
        $(dispCont).addClass('fliperoo-animating').transition(transition, opts.transTime, opts.easing, function(){
          // when all the animations are done...
          $(this).removeClass('fliperoo-animating');
          // increment and modulus our indexes
          displayIndex = (displayIndex + 1) % (displayItems.length);
          stockIndex = (stockIndex + 1) % (stockItems.length);
          // set the timer for the next one
          setTimeout(doNext, opts.delay);
        });
        
      };
      
      setTimeout(doNext, opts.delay);      
      
    });
  }
  
  //utility functions
  
  // Shuffle (randomize) an array
  function shuffle(o) {
  	for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  	return o;
  };
  
  
  
  // default options
  // this can also be read as a manual for the plugin
  jQuery.fliperoo.defaults = {
    delay: 2000,
    // milliseconds between swaps
    
    transition: {
      perspective: '500px',
      rotateY: '+=180deg'
    },
    // transit properties. See http://ricostacruz.com/jquery.transit/
    // for proper function it should flip element 180deg
    // when overriding the 'trasition' default, all properties of the transition should be specified
    // only Y-axis rotation currently works
    
    transTime: 1000,
    // transition time in milliseconds
    
    easing: 'cubic-bezier(.44,-0.23,.51,1.44)',
    // easing options from http://ricostacruz.com/jquery.transit/
    // I recommend http://cubic-bezier.com/
    
    randomize: false,
    // true = randomize the stockpile
    // false = go through stockpile in order
    
    displayCount: 4,
    // when using a single list, how many items should be displayed?
    // the remainder will be hidden
    // 0 = all (hide none)
    
    displayOrder: 'random',
    // options: 'random', 'forward', 'reverse'
    // how should the repeating pattern of display order be chosen?
    
    
    // ideas ------------------------------
    
    perspective: '500px',
    
    rotateDirection: '+',
    // options: '+', or '-'
    // rotate forward or back
    
    flipFlop: false,
    // if true, rotationDirection will alternate with each flip
    
    rotateStyle: 'Y',
    // options: 'X', 'Y', 'XYZ'
    // rotate along X, Y, or all axes
    
    xyzValues: '1,1,0',
    // if choosing XYZ above, these values will be used for rotation
    // values are X, Y, Z axis in a range from 0 to 1
    
    flipFlop: false,
    // change 
    
    
    // these options don't work yet -------------------
    
    iterations: 0,
    // How many times should we iterate through the stockpile?
    // 0 = infinite
    
    pauseOnMouseover: false,
    // Pause when mouse hovers over the display container?
    
    customAnimation: false,
    // function to use for custom animations
    
    justVisible: true,
    // just swap out visible items
    
    hideAllBut: 0,
    // Number of items to show, hiding the remainder to use in the stockpile.
    // This is usually best handled with CSS, but if you'd like non-JS fallback
    // to be display of all images, then enter a number here.
    // 0 = show all (hide none)
    // example::    hideAllBut: 5
    
    
    
  };
  
  // override defaults by including a file overriding jQuery.fliperoo.options
  jQuery.fliperoo.options = {};
  
})(jQuery);