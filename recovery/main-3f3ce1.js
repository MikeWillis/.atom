/* included on the design interface page, this handles:
* 1. all interactions with the design interface
* 2. saving the chosen design data to the DB
*
* note that several important functions are expected to be implemented by
*** the labelType's specific .js file
*/

window.FashioncraftDesigner = {};
window.FashioncraftDesigner.MiscData = {};
window.FashioncraftDesigner.Settings = {};
window.FashioncraftDesigner.Utilities = {};
window.FashioncraftDesigner.LocalUtilities = {};
window.FashioncraftDesigner.EventHandlers = {};
window.FashioncraftDesigner.LocalEventHandlers = {};
window.FashioncraftDesigner.Timers = {};
window.FashioncraftDesigner.Flags = {};
window.FashioncraftDesigner.CurrentChoices = {};
window.FashioncraftDesigner.HistorySteps = [];
window.FashioncraftDesigner.CurrentHistoryStep = -1;
window.FashioncraftDesigner.Flags.MobileDragDetected = false;
window.FashioncraftDesigner.Intervals = {};
window.FashioncraftDesigner.MiscData.NavTypeSelectors = [];

window.FashioncraftDesigner.Settings.SaveURL = "/Designer/save.php";
window.FashioncraftDesigner.Settings.RollSpeed = 250;
window.FashioncraftDesigner.Settings.SlideSpeed = "fast"; // "fast", "slow", or a number or something
window.FashioncraftDesigner.Settings.MinimumSwipeThreshold = 150; // must swipe at least this far to be considered a swipe
window.FashioncraftDesigner.Settings.MobilePanelSwipeStartX;
window.FashioncraftDesigner.Settings.MobilePanelSwipeStartY;
window.FashioncraftDesigner.Settings.PanelHeaderAnimationStarted = false;
window.FashioncraftDesigner.Settings.AllowSubPanelTransferAnimation = false;
window.FashioncraftDesigner.Settings.ReachedLastStep = false;
window.FashioncraftDesigner.Settings.storedText;
window.FashioncraftDesigner.Settings.savedLayout; // stores previous layout for tt labels
window.FashioncraftDesigner.Settings.savedBackdrop; // stores previous backdrop color from photo labels
window.FashioncraftDesigner.Settings.typingTimer;

window.FashioncraftDesigner.Utilities.$ = {}; // this is a bunch of "fake" jQuery replacement functions

// switched to GSAP on 2017-10-19. It's much smoother than both jQuery and CSS3 animations/transitions/transforms.
window.FashioncraftDesigner.Settings.AnimationMethod = "GSAP"; // "jQuery", "CSS3", "GSAP", or false
window.FashioncraftDesigner.Settings.GSAPTransitionSpeeds = {
   "PanelSlide": .5,
   "PanelRoll": .5,
   "NavShowHide": .5,
   "Fade": .5,
   "PointerMove": .5
};

window.FashioncraftDesigner.MiscData.TransitionEndEventList = "transitionend webkitTransitionEnd oTransitionEnd msTransitionEnd";
window.FashioncraftDesigner.MiscData.AnimationEndEventList = "animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd";
window.FashioncraftDesigner.MiscData.AnimationTransitionEventListsCombined = window.FashioncraftDesigner.MiscData.TransitionEndEventList + " " + window.FashioncraftDesigner.MiscData.AnimationEndEventList;

window.FashioncraftDesigner.Utilities.$.hasClass = function( el, className ) {
   if (el.classList) {
      return el.classList.contains(className);
   } else {
      return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
   }
};
window.FashioncraftDesigner.Utilities.$.addClass = function( el, className ) {
   if (el.classList) {
      el.classList.add(className);
   } else {
      el.className += ' ' + className;
   }
};
window.FashioncraftDesigner.Utilities.$.removeClass = function( el, className ) {
   if (el.classList) {
      el.classList.remove(className);
   } else {
      el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
   }
};
window.FashioncraftDesigner.Utilities.$.trigger = function( el, eventName ) {
   if ( document.createEvent ) {
      var event = document.createEvent('HTMLEvents');
      event.initEvent(eventName, true, false);
      el.dispatchEvent(event);
   } else {
      el.fireEvent(eventName);
   }
};
window.FashioncraftDesigner.Utilities.$.forEachElement = function( selector, fn ) {
   var elements = document.querySelectorAll(selector);
   for ( var i = 0; i < elements.length; i++ ) {
      fn( elements[i], i );
   }
};
window.FashioncraftDesigner.Utilities.$.on = function( el, eventName, handler ){
   if ( el.addEventListener ) {
      el.addEventListener(eventName, handler);
   } else {
      el.attachEvent("on" + eventName, function(){
         handler.call(el);
      });
   }
};

window.FashioncraftDesigner.Utilities.SetLazyLoad = function( $elContainer ) {
   //console.log("setting lazy load for container of length '" + $elContainer.length + "':"); console.log($elContainer);
   if ( "IntersectionObserver" in window && "IntersectionObserverEntry" in window && "intersectionRatio" in window.IntersectionObserverEntry.prototype ) {
      // hmm.. IntersectionObserver is supported.. let's use that instead of jQuery's lazyload plugin
      const config = {
         threshold: 0.05
      };

      // The observer for the images on the page
      let observer = new IntersectionObserver(function(entries){
         entries.forEach(function(entry) {
            // Are we in viewport?
            if ( entry.intersectionRatio >= 0.05 ) {
               // Stop watching
               observer.unobserve(entry.target);
               entry.target.setAttribute("src", entry.target.getAttribute("data-original"));
            }
         });
      }, config);

      $elContainer.each(function(index){
         let $ParentID = jQuery(this).parents("[id]").attr("id");
         var objects = document.querySelectorAll( "#" + $ParentID + " img.lazyLoad");
         if ( false ) {
            console.log("----------------------------------------");
            console.log("$Parent: ", $Parent);
            console.log("$ParentID: ", $ParentID);
            console.log("$container: ", $container);
            console.log("$container.selector: ", $container.selector);
            console.log("$container[0].selector: ", $container[0].selector);
            console.log("objects.length: ", objects.length);
         }
         for ( var i = 0; i < objects.length; ++i ) {
            observer.observe( objects[i] );
         }
      });

   } else {
      if ( $elContainer.find("img.lazyLoad").length ) {
         $elContainer.find("img.lazyLoad").lazyload({
            threshold: 200,
            container: $elContainer
         }).attr("data-lazyLoadInitialized",$elContainer.attr("id"));
      }
   }
};

window.FashioncraftDesigner.Utilities.searchDesigns = function( query ) {
   //console.log("Searching designs for " + query);
   var noResults = "<p class='noResultsLabel' style='margin:45px auto; text-align:center; font-size: 2em; color:grey;'>No results</p>";
   var sugLabel = jQuery('.suggestionLabel');

   const haystack = new Haystack({
     caseSensitive: false,
     flexibility: 0,
     stemming: true,
     exclusions: /[-\//.,;:?\\'"<>!_]/g
   });

   var tokens = haystack.tokenize(query);

   // Search corrections / replacements:
   for(let i=0; i< tokens.length; i++){
      if( tokens[i] in corrections ){
         tokens[i] = corrections[tokens[i]];
      }
   }

   // NOTE: Haystack implementation not finished, use old method for now
   // Define pool of 'source' terms to search, stored in searchResults:
   if(false && window.location.search.indexOf("haystack") != -1) {
     var source = [];

     jQuery('.panelContent').find('img').each(function(){
       source.push( jQuery(this).attr('data-graphicName') );
       let tags = jQuery(this).attr('data-tags').split('\n');
       for(let i=0; i<tags.length; i++){
         source.push(tags[i]);
       }
     });

     var searchResults = haystack.search(query, source, 999);

     if( searchResults ){
       //console.log("results");
       //loop through image name/tags, loop through searchResults
       // if searchResults[i] is found, show this image
       // else, hide it
     }
   }


   // Remove unnecessary characters, including 's' from the end of words:
   for(let i=0; i< tokens.length; i++) {
      let lastChar = tokens[i].substr(tokens[i].length - 1);
      if ( lastChar === 's'){
         tokens[i] = tokens[i].slice(0, -1);
      }
      tokens[i] = tokens[i].replace( /[-\//.,;:?\\'"<>!_]/g, '' );
   }


    // NOTE: as of 2017-12-08, a query should always be present
   jQuery('.graphicSearchBox').parent().parent().find(".panelContent").find("li").each(function(index) {
      var $thisListItem = jQuery(this);
      for(var i=0; i< tokens.length; i++){
         if( $thisListItem.find("img").attr("data-graphicName") != undefined &&
         $thisListItem.find("img").attr("data-graphicName").toLowerCase().indexOf( tokens[i] ) != -1 ||
         $thisListItem.find("img").attr("data-tags") != undefined &&
         $thisListItem.find("img").attr("data-tags").toLowerCase().indexOf( tokens[i] ) != -1 ) {
            $thisListItem.show().find("img.lazyLoad").trigger("appear");
         }
         else {
            $thisListItem.hide();
            break;
         }
      }
   });

   // Hide category headers and empty divs:
   $('.panelContent h3').each(function() {
      var categoryHeader = $(this);
      categoryHeader.hide();
      categoryHeader.next('div').removeClass('ui-accordion-content ui-corner-bottom').css("height","auto").css("overflow-y","visible");
      if( categoryHeader.next('div').find('img:visible').length == 0 ){
         categoryHeader.next('div').hide();
      }
      else {
        categoryHeader.next('div').show();
      }
   });


   // If no results:
   if( jQuery('.panelContent img:visible').length == 0 ) {
     let suggestion = window.FashioncraftDesigner.Utilities.getSuggestion(query);

     // If there's a valid suggestion, show it:
      if(suggestion != "" &&  suggestion != null){
         jQuery('.suggestionLabel').slideDown('fast');
         jQuery('.searchSuggestion').text(suggestion);
      }

      // If 'no results' message isn't already there, show it:
      if( jQuery('.noResultsLabel').length == 0 ){
         jQuery('.panelContent').append(noResults);
         window.FashioncraftDesigner.Utilities.OpacityFade( jQuery(".designTop"), 0 );
      }
   }

   // If there ARE results:
   else if( jQuery('.panelContent img:visible').length > 0 ){
     if( jQuery('.noResultsLabel').length != 0 ) {
        jQuery('.noResultsLabel').remove();
        jQuery('.suggestionLabel').slideUp('fast');
        window.FashioncraftDesigner.Utilities.OpacityFade( jQuery(".designTop"), 1 );
     }
      // Check for duplicates:
      let visibleImages = jQuery('.panelContent img:visible');
      let duplicates = [];
      for(let i=0; i<visibleImages.length; i++){
         let occurrence = 0;
         for(let j=0; j<visibleImages.length; j++){
            if( visibleImages[i].getAttribute('data-graphicname') == visibleImages[j].getAttribute('data-graphicname') ){
               occurrence++;
               if(occurrence > 1 && $.inArray(visibleImages[j], duplicates) == -1 ){
                  duplicates.push(visibleImages[j]);
               }
            }
         }
      }
      for(let i=0; i<duplicates.length; i++){
         jQuery(duplicates[i]).parent().hide();
      }
   }

}; // end searchDesigns()


window.FashioncraftDesigner.Utilities.getSuggestion = function(userInput) {
  // NOTE: possibleTerms includes only the terms with results for BOTH sticker & glass items
  let possibleTerms = ["wedding","baby","baby shower","birthday","anniversary",
    "religious","marquee","monogram","baptism","communion","confirmation","quinceanera",
    "holiday","christmas","hanukkah","nautical","retirement","winter","spring","summer",
    "fall","heart","love","celebration","couple","drink","cake","graduation","tropical",
    "galaxy","fleur de lis","cheers","flowers","vegas","casino","butterfly","bird","tree",
    "crown","vintage","princess","emoji","constellation","silhouette","customizable","personalized",
    "unicorn","church","champagne","animals","snowflake","candle","christening","ladybug","bridal shower",
    "sweet 16","new year","elephant","autumn","paris","beach","flamingo","balloons","gender reveal",
    "cupcake","banner","star","cross","present","stroller","diploma","pineapple","diamond","indian",
    "irish","fashion","wreath","martini", "claddagh", "rainbow", "bar mitzvah", "bat mitzvah",
    "adventure","antique","leaves","bachelorette","blank","bible","ampersand","peace","occupation",
    "police","firefighter","teacher","medical","nurse","doctor","dentist","sports","football","baseball",
    "hockey","soccer","tennis","fishing","bowling","golf","tournament"];

  if( window.location.search.indexOf('Memorial') != -1 ){
    possibleTerms.push('memorial');
  }

  const haystack = new Haystack({
    caseSensitive: false,
    flexibility: 2
  });

  let suggestion = haystack.getSuggestions(userInput, possibleTerms, 1);

  if( suggestion ){
    return suggestion[0];
  } else {
    return null;
  }

}


window.FashioncraftDesigner.Utilities.PrepareCroppie = function() {
   // Change crop shape based on current item shape:
   var $uploadCrop;
   var labelShape = window.FashioncraftDesigner.Settings.CalculatedLabelShape;
   var itemNum = window.FashioncraftDesigner.Settings.LabelType.substring(0, 4);
   switch ( labelShape ){
   case 'c':
      var cropShape = "circle";
      var height = 200;
      var width = 200;
      break;
   case 'tt':
      var cropShape = "square";
      switch( itemNum ){
      case '6704':
      case "6700":
         var height = 258;
         var width = 165;
         break;
      }
      break;
   }

   //console.log("preparing, height = '" + height + "', cropShape = '" + cropShape + "'");
   // Initialize Croppie:
   if( jQuery('#crop-box').length ){
      $uploadCrop = jQuery('#crop-box').croppie({
         viewport: {
            type: cropShape,
            width: width,
            height: height
         },
         enableExif: true,
         enableOrientation: true
      });
   }

   // Event handlers:
   jQuery('#upload-btn').on('change', function() {
      //console.log("changing");
      readFile(this);
   });
   jQuery('.rotate-left').on('click', function(e) {
      e.preventDefault();
      $uploadCrop.croppie('rotate', -90);
   });
   jQuery('.rotate-right').on('click', function(e) {
      e.preventDefault();
      $uploadCrop.croppie('rotate', 90);
   });
   jQuery('#done-btn').on('click', function(ev) {
      $uploadCrop.croppie('result', {
         type: 'canvas',
         size: 'viewport'
      }).then(function(resp) {
         completeCrop({
            src: resp
         });
      });
   });
   jQuery('.rotate-btn, #done-btn').on({
      mouseenter: function(){
         $(this).addClass('ui-state-hover');
      },
      mouseleave: function(){
         $(this).removeClass('ui-state-hover');
      }
   });

   function readFile(input) {
      if (input.files && input.files[0]) {
         var reader = new FileReader();
         reader.onload = function(e) {
            //console.log("file read");
            jQuery('.upload-demo').addClass('ready');
            $uploadCrop.croppie('bind', {
               url: e.target.result
            }).then(function() {
            });
         }
         reader.readAsDataURL(input.files[0]);
      } else {
         alert("Sorry - you're browser doesn't support the FileReader API");
      }
   }

   function completeCrop(result) {
      var finalImage;
      if (result.finalImage) {
         finalImage = result.finalImage;
      }
      if (result.src) {
         finalImage = '<img src="' + result.src + '" />';
      }
      //jQuery('.screen').find('img').attr('src', result.src).attr('width', 200);
      //jQuery('.label').empty().append(finalImage).attr('width', '100%');
      jQuery('.userImage img').attr('src', result.src);
      jQuery('#crop-box').effect( "transfer", {to: jQuery('#canvas')}, 400 );
   }

} // End prepareCroppie()

window.FashioncraftDesigner.Utilities.PrepareScreenshot = function() {
   var element = $("#canvas");
   var getCanvas;
   if( window.location.href.indexOf("canvasScreenshot") != -1) {

       $("#download-btn").on('click', function() {
          html2canvas(element, {
           onrendered: function (canvas) {
             $('body').append(canvas).append('<a href="" id="save-btn">Save</a>');
             getCanvas = canvas;
            }
          });
          var imageURL = getCanvas.toDataURL();
          console.log(imageURL);

          $.ajax({
            type: "POST",
            url: "saveProof.php",
            data: {
              savedImage: imageURL
            }
          }).done(function(o){
            console.log("Saved to server");

          });
       });

   }
};

window.FashioncraftDesigner.Utilities.GetParameterByName = function( name, url ) {
   // v1.1: allows url to be passed in (so a link can be checked instead)
   /*
   * taken and modified from http://stackoverflow.com/questions/901115/get-query-string-values-in-javascript
   * pulls a url parameter from the query string (or querystring, so I can find this if I do a CTRL+F)
   * you can use this like so:
   * if ( window.FashioncraftDesigner.Utilities.GetParameterByName( "MyParamater" ) == "1" ) {
   */
   name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
   var regexS = "[\\?&]" + name + "=([^&#]*)";
   var regex = new RegExp(regexS);

   var searchString = typeof( url ) == "undefined" ? window.location.search : "?" + url.split("?")[1];
   if ( window.fashioncraftDebug ) { console.log("searchString = '" + searchString + "'"); }
   var results = regex.exec(searchString);
   if ( results == null ) {
      return "";
   } else {
      return decodeURIComponent(results[1].replace(/\+/g, " "));
   }
};

window.FashioncraftDesigner.Utilities.SetTooltips = function() {
   // this list of selectors is for the option panels, don't use it for normal tooltips as these are selected and positioned oddly
   var positionedSelectors = [];
   positionedSelectors.push("#fullPanel-Design");
   positionedSelectors.push("#fullPanel-Pattern");
   positionedSelectors.push("#fullPanel-Color");
   positionedSelectors.push("#fullPanel-Text .subPanel:eq(0)");
   positionedSelectors.push("#fullPanel-Text .subPanel:eq(1)");
   for( var i = 0; i < positionedSelectors.length; i++ ) {
      window.FashioncraftDesigner.Utilities.SetIndividualTooltip( jQuery(positionedSelectors[i] + " li," + positionedSelectors[i] + " input"), positionedSelectors[i] );
   }

   // tooltips with HTML
   var htmlSelectors = [];
   htmlSelectors.push(".helpIcon");
   for( var i = 0; i < htmlSelectors.length; i++ ) {
      window.FashioncraftDesigner.Utilities.SetIndividualTooltip( jQuery(htmlSelectors[i]), false, true );
   }

   // normal tooltips
   var normalSelectors = [];
   normalSelectors.push(".history > span");
   normalSelectors.push("input.quantity");
   normalSelectors.push(".textColorSubPanel a");
   normalSelectors.push("#ChangeLabelType_Buttonset label");
   for( var i = 0; i < normalSelectors.length; i++ ) {
      window.FashioncraftDesigner.Utilities.SetIndividualTooltip( jQuery(normalSelectors[i]), false );
   }
};

window.FashioncraftDesigner.Utilities.SetIndividualTooltip = function( $el, $position, html ) {
   // this list of selectors is for the option panels, don't use it for normal tooltips as these are selected and positioned oddly
   var options = {};
   options.tooltipClass = "tooltips";
   if ( $position ) {
      options.position = { my: "right top", at: "right top-3", of: $position };
   }
   if ( html ) {
      // see http://stackoverflow.com/questions/15734105/jquery-ui-tooltip-does-not-support-html-content
      options.content = function () { return this.getAttribute("title"); }
   }
   $el.tooltip( options );
};

window.FashioncraftDesigner.Utilities.SetDesignTextTooltip = function() {
   jQuery('.fa-info-circle').tooltip({
      items: '.fa-info-circle',
      position: {my: 'left-3 bottom-3', at: 'left top', collision: 'flipfit'},
      track: false
   });

   jQuery('.fa-info-circle').on('mouseover click', function(e) {
      e.preventDefault();
      var $infoCircle = $(this);
      $infoCircle.tooltip();
   });
};

window.FashioncraftDesigner.Utilities.SetNextPrevVisibility = function( navID ) {
   if ( jQuery("#" + navID + " :radio:checked").prev("input[type='radio']").length ) {
      jQuery("#nextPrevious .previous").button("enable");
   } else {
      jQuery("#nextPrevious .previous").button("disable");
   }

   if ( jQuery("#" + navID + " :radio:checked").next("input[type='radio']").length ) {
      jQuery("#nextPrevious .next").button("enable");
   } else {
      jQuery("#nextPrevious .next").button("disable");
   }
};

window.FashioncraftDesigner.Utilities.SetHeaderSubmitVisibility = function( navID ) {
   if ( jQuery("#" + navID + " :radio:checked").next("input[type='radio']").length ) {
      if ( window.FashioncraftDesigner.Settings.ReachedLastStep && jQuery("#headerCompleteDesign").is(":hidden") ) {
         window.FashioncraftDesigner.Utilities.ShowHeaderSubmit();
      }
   } else if ( !window.FashioncraftDesigner.Settings.ReachedLastStep ) {
      window.FashioncraftDesigner.Settings.ReachedLastStep = true;
   }
};

window.FashioncraftDesigner.Utilities.ShowHeaderSubmit = function() {
   // because I don't like having the same block of code in more than one spot...
   jQuery("#headerCompleteDesign").css({
      "display":"inline-block"
   }).animate({
      "opacity": 1
   });
};

window.FashioncraftDesigner.Utilities.AnimateMobilePanelHeader = function() {
   if ( !window.FashioncraftDesigner.Settings.PanelHeaderAnimationStarted ) {
      window.FashioncraftDesigner.Settings.PanelHeaderAnimationStarted = true;
      var $element = jQuery(".mobilePanel .panelHeader .fa-hand-pointer-o");
      if ( $element.length ) {
         setInterval(function () {
            $element.fadeOut(500, function () {
               $element.fadeIn(500);
            });
         }, 2000);
      }
   }
};

window.FashioncraftDesigner.Utilities.GetPanelHeight = function( $panel ) {
   var result;
   if ( typeof( $panel.data("defaultHeight") ) == "undefined" ) {
      $panel.css("height","auto");
      result = $panel.height();
      $panel.css("height","");
   } else {
      result = $panel.data("defaultHeight");
   }
   return result;
};

window.FashioncraftDesigner.Utilities.MobilePanelRollUp = function( $panel ) {
   var defaultHeight;
   switch( window.FashioncraftDesigner.Settings.AnimationMethod ) {
   case "jQuery":
      defaultHeight = window.FashioncraftDesigner.Utilities.GetPanelHeight( $panel );
      $panel.data({"defaultHeight": defaultHeight, "state":"rolledUp"}).animate({ height: jQuery("#optionPanels").height(), scrollTop: 0 }, window.FashioncraftDesigner.Settings.RollSpeed, function(){
         $panel.find(".mobilePanelFullRolldown").show();
      });//.find(".mobilePanelFullRolldown").show(); // original height is saved for rolling down later
      break;
   case "CSS3":
      $panel.data({"state":"rolledUp"}).scrollTop(0).removeClass("RolledDown").find(".mobilePanelFullRolldown").show();
      break;
   case "GSAP":
      TweenLite.to( $panel, window.FashioncraftDesigner.Settings.GSAPTransitionSpeeds.PanelRoll, {
         css: {
            height: jQuery("#optionPanels").height()
         },
         onComplete: function(){
            $panel.data({"state":"rolledUp"}).find(".mobilePanelFullRolldown").show();
         },
         scrollTo:{y:0}
      });
      break;
   case false:
      defaultHeight = window.FashioncraftDesigner.Utilities.GetPanelHeight( $panel );
      $panel.data({"defaultHeight": defaultHeight, "state":"rolledUp"}).css({ height: jQuery("#optionPanels").height(), scrollTop: 0 });
      $panel.find(".mobilePanelFullRolldown").show();
      break;
   }

   window.FashioncraftDesigner.Utilities.AnimateMobilePanelHeader();
};

window.FashioncraftDesigner.Utilities.MobilePanelRollDown = function( $panel ) {
   var defaultHeight;
   switch( window.FashioncraftDesigner.Settings.AnimationMethod ) {
   case "jQuery":
      defaultHeight = window.FashioncraftDesigner.Utilities.GetPanelHeight( $panel );
      $panel.data({"state":"rolledDown"}).animate({ height: defaultHeight, scrollTop: 0 }, window.FashioncraftDesigner.Settings.RollSpeed, function(){
         $panel.find(".mobilePanelFullRolldown").hide();
      });//.find(".mobilePanelFullRolldown").hide();
      break;
   case "CSS3":
      $panel.data({"state":"rolledDown"}).scrollTop(0).addClass("RolledDown").find(".mobilePanelFullRolldown").hide();
      break;
   case "GSAP":
      $panel.find(".mobilePanelFullRolldown").hide();
      TweenLite.to( $panel, window.FashioncraftDesigner.Settings.GSAPTransitionSpeeds.PanelRoll, {
         css: {
            height: $panel.data("RolledDownHeight")
         },
         onComplete: function(){
            $panel.data({"state":"rolledDown"});
         },
         scrollTo:{y:0}
      });
      break;
   case false:
      defaultHeight = window.FashioncraftDesigner.Utilities.GetPanelHeight( $panel );
      $panel.data({"state":"rolledDown"}).css("height",defaultHeight).find(".mobilePanelFullRolldown").hide();
      break;
   }

   window.FashioncraftDesigner.Utilities.AnimateMobilePanelHeader();
};

window.FashioncraftDesigner.Utilities.PreparePhotoUploadButtonset = function() {
  /* This is no longer used since there is no Photo Upload buttonset... I'll keep it here just in case */
   if ( jQuery("#ChangeLabelType_Buttonset").length ) {
      jQuery("#ChangeLabelType_Buttonset").buttonset().change(function(event){
         window.FashioncraftDesigner.Flags.GSAPNavHiding = true;
         var $ClickedElement = jQuery("#ChangeLabelType_Buttonset :radio:checked");

         // check which button was clicked and assign the active class
         if ( $ClickedElement.attr("id") == "ChangeLabelType-DYO" ) {
            // clicked 'design your own'
            jQuery('#fullPhotoNav').removeClass('active-btns');
            jQuery('#fullNav').addClass('active-btns');
            if( jQuery('.label .textLine1').hasClass('blackBackdrop') ){
              window.FashioncraftDesigner.Settings.savedBackdrop = 'blackBackdrop';
            }
            else if( jQuery('.label .textLine1').hasClass('whiteBackdrop') ){
              window.FashioncraftDesigner.Settings.savedBackdrop = 'whiteBackdrop';
            }
            jQuery('.label .textLine1, .label .textLine2, .label .textLine3').removeClass('blackBackdrop whiteBackdrop');

            // if savedLayout is set, add that class, otherwise just add layout-A:
            if ( typeof window.FashioncraftDesigner.Settings.savedLayout !== undefined ) {
              jQuery('.label').removeClass('layout-P').addClass(window.FashioncraftDesigner.Settings.savedLayout);
            } else {
              jQuery('.label').removeClass('layout-P').addClass('layout-A');
            }
         }
         else {
            // clicked 'photo upload'
            jQuery('#fullNav').removeClass('active-btns');
            jQuery('#fullPhotoNav').addClass('active-btns');

            // if layout-A or layout-B is found, save it to savedLayout
            if ( jQuery('.label').hasClass('layout-A') ){
              window.FashioncraftDesigner.Settings.savedLayout = 'layout-A';
            } else if( jQuery('.label').hasClass('layout-B') ){
              window.FashioncraftDesigner.Settings.savedLayout = 'layout-B';
            }
            jQuery('.label').removeClass('layout-A layout-B').addClass('layout-P');

            // re-apply text color & backdrop options when switching back to photo
            if( typeof window.FashioncraftDesigner.Settings.savedBackdrop !== undefined) {
              jQuery('.label .textLine1, .label .textLine2, .label .textLine3').addClass(window.FashioncraftDesigner.Settings.savedBackdrop);
              // show corresponding text color:
              switch(window.FashioncraftDesigner.Settings.savedBackdrop){
                case "blackBackdrop":
                  window.FashioncraftDesigner.CurrentChoices.TextLine1ColorHexCode = "White";
                  window.FashioncraftDesigner.CurrentChoices.TextLines2And3ColorHexCode = "White";
                  jQuery(".label .textLine1").css("color",window.FashioncraftDesigner.CurrentChoices.TextLine1ColorHexCode);
                  jQuery(".label .textLine2,.label .textLine3").css("color",window.FashioncraftDesigner.CurrentChoices.TextLines2And3ColorHexCode);
                  break;
                case "whiteBackdrop":
                  window.FashioncraftDesigner.CurrentChoices.TextLine1ColorHexCode = "Black";
                  window.FashioncraftDesigner.CurrentChoices.TextLines2And3ColorHexCode = "Black";
                  jQuery(".label .textLine1").css("color",window.FashioncraftDesigner.CurrentChoices.TextLine1ColorHexCode);
                  jQuery(".label .textLine2,.label .textLine3").css("color",window.FashioncraftDesigner.CurrentChoices.TextLines2And3ColorHexCode);
                  break;
              }
            }

         }
         jQuery(".active-btns").trigger("change");

         TweenLite.to("#fullNav,#fullPhotoNav,.ChangeLabelType", window.FashioncraftDesigner.Settings.GSAPTransitionSpeeds.NavShowHide, {
            css: {
               opacity: "0"
            },
            onComplete: function(){
               window.FashioncraftDesigner.Flags.GSAPNavHiding = false;

               // these changes are always made regardless of which button they clicked
               jQuery(".PhotoEnabledLabel").removeClassRegex(/^PhotoLabelStyle-/);

               // now determine which button was clicked and then show the appropriate nav type
               if ( $ClickedElement.attr("id") == "ChangeLabelType-DYO" ) {
                  // design your own
                  jQuery(".PhotoEnabledLabel").addClass("PhotoLabelStyle-DYO");
                  jQuery('#canvas').removeClass('photoCanvas').removeClass('PhotoTextShadow_White').removeClass('PhotoTextShadow_Black');
               } else {
                  // photo upload
                  jQuery(".PhotoEnabledLabel").addClass("PhotoLabelStyle-Photo");
                  jQuery('#canvas').addClass('photoCanvas');

                  if ( false ) {
                     // TODO: determine which one of these to add, depending on the current text color choice
                     jQuery('#canvas').addClass("PhotoTextShadow_White");
                     //jQuery('#canvas').addClass('PhotoTextShadow_Black');
                  }
               }

               // finally, show the appropriate nav (this will also automatically click the first button)
               window.FashioncraftDesigner.Utilities.ShowPhotoNav();
            }
         });
         // lastly see if we should show or hide text color options:
         window.FashioncraftDesigner.LocalUtilities.AdjustTextColorChoiceVisibility();
      });
   } else {
      //console.log("not found");
   }
};

window.FashioncraftDesigner.Utilities.AnimateSearchDesignPlaceholder = function( $parent ){
   var $el = $parent.find(".graphicSearchBox");
   if ( typeof( $el.data("PlaceholderAnimated") ) == "undefined" ) {
      $el.data("PlaceholderAnimated",true);
      $el.attr("placeholder", "");
      var Placeholder = "Click Here To Search Designs";
      var AnimationInterval = setInterval(function() {
         if ( $el.attr("placeholder") == Placeholder + "|" ) {
            clearInterval(AnimationInterval);
            $el.attr("placeholder", Placeholder);
         } else {
            var CurrentPlaceholder = $el.attr("placeholder").replace(/\|/g, "");
            var NextLetter = Placeholder[CurrentPlaceholder.length];
            $el.attr("placeholder", CurrentPlaceholder + NextLetter + "|");
         }
      }, 75);
   }
};

window.FashioncraftDesigner.Utilities.OpenFirstCategory = function( $parent ){
   // is there an accordion or tab here? Are all panels collapsed? if so, show the first one (or the default one)
   if ( !$parent.find(".jqAccordion").accordion( "option", "active" ) ) {
      var $accordion = $parent.find(".jqAccordion");
      var defaultTabIndex = $accordion.data("defaultTabIndex") || 0;
      $accordion.accordion( "option", "active", defaultTabIndex );
   }
   if ( !$parent.find(".jqTabs").tabs( "option", "active" ) ) {
      var $tabs = $parent.find(".jqTabs");
      var defaultTabIndex = $tabs.data("defaultTabIndex") || 0;
      $tabs.tabs( "option", "active", defaultTabIndex );
   }
};

window.FashioncraftDesigner.Utilities.PrepareNavigationButtonsets = function( navType ) {
   /* navType is expected to be either "full" or "mobile"
   *** fullNav, mobileNav
   */
   if ( jQuery("#" + navType + "Nav").length ) {
      window.FashioncraftDesigner.MiscData.NavTypeSelectors.push("#" + navType + "Nav");
      jQuery("#" + navType + "Nav").buttonset().change(function(event){
         event.stopPropagation();
         event.preventDefault();
         /* nav radio buttons are set up with id's such as "fullNav-Layout" or "fullNav-Design"
         * the corresponding panels are set up with id's such as "fullPanel-Layout" or "fullPanel-Design"
         * so the task is:
         * 1. determine which panel we want to show
         * 2. check if that panel is already visible
         **** if so, great, do nothing
         **** else, slide out whatever panel is visible, and slide in the new one
         ****** to do so, we must also determine which direction we're sliding
         */
         // slide out the currently visible panel, slide in the appropriate one

         //console.log("change detected for navType '" + navType + "'");

         var NavButtonID = jQuery("#" + navType + "Nav :radio:checked").length ? jQuery("#" + navType + "Nav :radio:checked").attr("id") : jQuery("#" + navType + "Nav :radio:first").attr("id");
         var TransitionInSelector = "#" + NavButtonID.replace( "Nav", "Panel" );
         var $TransitionIn = jQuery(TransitionInSelector);

         if ( $TransitionIn.is(":visible") ) {
            // great, do nothing
            //console.log("it's visible, doing nothing");
         } else {
            //console.log("---transitioning---");
            //console.log("TransitionInSelector = '" + TransitionInSelector + "'");
            //console.log("TransitionOutSelector = '" + ".optionPanel." + navType.replace("Photo","") + "Panel:visible" + "'");

            var $TransitionOut = jQuery(".optionPanel." + navType.replace("Photo","") + "Panel:visible").not(TransitionInSelector);
            //console.log("$TransitionOut.length = '" + $TransitionOut.length + "'");
            //console.log("$TransitionOut.attr(id) = '" + $TransitionOut.attr("id") + "'");
            //var $TransitionOut = $TransitionIn.parent().find(".FrontAndCenter").length ? $TransitionIn.parent().find(".FrontAndCenter") : $TransitionIn.parent().find("div." + navType + "Panel:visible");
            var TransitionDirection = !$TransitionOut.length || $TransitionIn.attr("data-stepNumber") > $TransitionOut.attr("data-stepNumber") ? "RightToLeft" : "LeftToRight";
            var TransitionInClass = TransitionDirection == "RightToLeft" ? "WaitingOnRight" : "WaitingOnLeft";
            var TransitionOutClass = TransitionDirection == "RightToLeft" ? "WaitingOnLeft" : "WaitingOnRight";
            if ( false ) {
               console.log("-------------");
               console.log("NavButtonID",NavButtonID);
               console.log("navType",navType);
               console.log("TransitionInSelector",TransitionInSelector);
               console.log("TransitionInSelector length",$TransitionIn.length);
               console.log("$TransitionOut",$TransitionOut);
               console.log("$TransitionOut length",$TransitionOut.length);
               console.log("TransitionDirection",TransitionDirection);
               console.log("TransitionInClass",TransitionInClass);
               console.log("TransitionOutClass",TransitionOutClass);
            }

            switch( window.FashioncraftDesigner.Settings.AnimationMethod ) {
            case "jQuery":
               if ( !jQuery(TransitionInSelector).length ) {
                  // do nothing!
               } else {
                  var slideOutDirection = TransitionDirection == "RightToLeft" ? "left" : "right";
                  var slideInDirection = TransitionDirection == "RightToLeft" ? "right" : "left";

                  if ( jQuery("." + navType + "Panel:visible").length ) {
                     jQuery("." + navType + "Panel:visible").hide("slide", {direction: slideOutDirection }, window.FashioncraftDesigner.Settings.SlideSpeed );
                  }

                  if ( jQuery(TransitionInSelector).length ) {
                     window.FashioncraftDesigner.Utilities.OpenFirstCategory( jQuery(TransitionInSelector) );
                     jQuery(TransitionInSelector).show("slide", {direction: slideInDirection },window.FashioncraftDesigner.Settings.SlideSpeed );
                  }
               }
               break;
            case "CSS3":
               var SlideInFromClass = $TransitionIn.attr("data-stepNumber") < $TransitionOut.attr("data-stepNumber") ? "FromLeft" : "FromRight";
               var SlideInClasses = "FrontAndCenter " + SlideInFromClass;

               $TransitionIn.css("display","block").removeClass("RolledDown").addClass("NoTransitions").addClass(TransitionInClass).removeClass("NoTransitions");
               setTimeout(function(){
                  $TransitionIn.on(window.FashioncraftDesigner.MiscData.AnimationTransitionEventListsCombined, function(){
                     $TransitionIn.off(window.FashioncraftDesigner.MiscData.AnimationTransitionEventListsCombined);
                     if ( navType == "mobile" ) {
                        window.FashioncraftDesigner.Utilities.MobilePanelRollDown( $TransitionIn );
                     }

                     window.FashioncraftDesigner.Utilities.OpenFirstCategory( $TransitionIn );
                  }).addClass(SlideInClasses).removeClass("WaitingOnLeft WaitingOnRight");
               },10);

               $TransitionOut.addClass(TransitionOutClass).removeClass("FrontAndCenter FromRight FromLeft").one('animationend webkitAnimationEnd oanimationend MSAnimationEnd', function(){
                  if ( !$TransitionOut.hasClass("FrontAndCenter") ) { $TransitionOut.css("display","none"); }
               });
               break;
            case "GSAP":
               // TransitionDirection will be either "RightToLeft" or "LeftToRight"
               //console.log("GSAP animating");
               //console.log("TransitionDirection = '" + TransitionDirection + "'");
               //console.log("$TransitionIn id = '" + $TransitionIn.attr("id") + "'");
               //console.log("$TransitionOut id = '" + $TransitionOut.attr("id") + "'");

               // determine the starting / ending positions of each panel
               var IncomingStartLeft = TransitionDirection == "RightToLeft" ? "100%" : "-100%";
               var OutgoingEndLeft = TransitionDirection == "RightToLeft" ? "-100%" : "100%";

               /* prepare the incoming panel. While we're at it, let's find out how tall it would like
               * to be, by setting the height to auto temporarily. We'll use the momentarily when we roll it down.
               * If it wants to be too tall, we can use this chance to shrink it down
               *
               * 2017-10-26: what if the panel has an accordion or something, and no sections are open?
               * then the panel will be really short even when the height is set to auto. Then we'll hardcode
               * a short height and it'll be ridiculous.
               * so check for a height that's too short as well.
               */
               var CurrentHeight = $TransitionIn.css("height");
               var RolledDownHeight;
               var MaxDesiredHeight = jQuery("#canvasContainer").height() * .9;
               //console.log("jQuery(#canvasContainer).height()", jQuery("#canvasContainer").height());
               //console.log("MaxDesiredHeight",MaxDesiredHeight);
               $TransitionIn.addClass("NoTransitions").removeClass("RolledDown").css({
                  "display": "block",
                  "left": IncomingStartLeft,
                  "height": "auto"
               });
               if ( $TransitionIn.height() > MaxDesiredHeight ) {
                  RolledDownHeight = (jQuery("#canvasContainer").height() * .9) + "px";
               } else {
                  RolledDownHeight = $TransitionIn.height() < 500 ? MaxDesiredHeight : $TransitionIn.css("height");
               }
               //console.log("RolledDownHeight",RolledDownHeight);
               $TransitionIn.data("RolledDownHeight",RolledDownHeight).css("height",CurrentHeight);

               // position the incoming panel
               TweenLite.to( $TransitionIn, window.FashioncraftDesigner.Settings.GSAPTransitionSpeeds.PanelSlide, {
                  css: {
                     left: "0%"
                  },
                  onComplete: function(){
                     $TransitionIn.addClass("FrontAndCenter");
                     window.FashioncraftDesigner.Utilities.MobilePanelRollDown( $TransitionIn );
                     window.FashioncraftDesigner.Utilities.OpenFirstCategory( $TransitionIn );
                     if ( $TransitionIn.find(".graphicSearchBox").length ) {
                        window.FashioncraftDesigner.Utilities.AnimateSearchDesignPlaceholder( $TransitionIn );
                     }
                  }
               });

               // position the outgoing panel
               /* NOTE: there's a chance, really only when the system first loads, that the incoming and outgoing
               * panels are the same panel. In this case, obviously, don't transition out the outgoing panel.
               */
               if ( $TransitionOut.attr("id") != $TransitionIn.attr("id") ) {
                  TweenLite.to( $TransitionOut, window.FashioncraftDesigner.Settings.GSAPTransitionSpeeds.PanelSlide, {
                     css: {
                        left: OutgoingEndLeft
                     },
                     onComplete: function(){
                        $TransitionOut.removeClass("FrontAndCenter").css("display","none");
                     }
                  });
               }
               break;
            case false:
               jQuery("." + navType + "Panel:visible").hide();
               jQuery(TransitionInSelector).show();
               window.FashioncraftDesigner.Utilities.MobilePanelRollDown( $TransitionIn );
               window.FashioncraftDesigner.Utilities.OpenFirstCategory( $TransitionIn );
               break;
            }

            window.FashioncraftDesigner.Utilities.SetNextPrevVisibility( "" + navType + "Nav" );
            window.FashioncraftDesigner.Utilities.SetHeaderSubmitVisibility( "" + navType + "Nav" );

            switch( window.FashioncraftDesigner.Settings.AnimationMethod ) {
            case "jQuery":
               window.FashioncraftDesigner.Utilities.MobilePanelRollDown( jQuery(TransitionInSelector) );
               break;
            case "CSS3":
               break;
            case "GSAP":
               break;
            }
         }
         return false;
      });
   }
};

window.FashioncraftDesigner.Utilities.HandleNextPrevclick = function( event, $this, buttonType ) {
   //jQuery("#canvas").append("<br>--hnpc, ets = '" + event.timeStamp + "', dts = '" + $this.data("eventTimeStamp") + "'");
   if ( (!window.FashioncraftDesigner.Flags.MobileDragDetected || event.type == "swipe") && (!$this.data("eventTimeStamp") || event.timeStamp != $this.data("eventTimeStamp")) ) {
      $this.data("eventTimeStamp",event.timeStamp);
      var navID;

      if ( jQuery(".header .navigation .active-btns").length ) {
         /* as of 2017-10-16 this is only used on ST items if we turn on the photo upload option */
         navID = jQuery(".header .navigation .active-btns").attr("id");
      } else {
         navID = jQuery("#fullNav:visible").length ? "fullNav" : "mobileNav";
      }
      //console.log("using navID '" + navID + "'");

      if ( buttonType == "next" ) {
         jQuery("#" + navID + " :radio:checked").nextAll("input:enabled:first[type='radio']").click();
      } else {
         jQuery("#" + navID + " :radio:checked").prevAll("input:enabled:first[type='radio']").click();
      }

      window.FashioncraftDesigner.Utilities.SetNextPrevVisibility( navID );
      window.FashioncraftDesigner.Utilities.SetHeaderSubmitVisibility( navID );
   }
};

window.FashioncraftDesigner.Utilities.AdjustSubPanelHeight = function( $subPanel ) {
   $subPanel.find("ul").css({
      "height": "300px",
      "overflow-x": "hidden",
      "overflow-y": "scroll"
   });
};

window.FashioncraftDesigner.Utilities.CompareTimestamps = function( $eventTarget, event ) {
   /* certain devices *cough*iphone*cough* annoyingly trigger both a touchend and a click event on every touchend.
   * Previously we were able to simply check if the timestamp of the event was the same as the last timestamp for this
   * event, but as of 2017-06-09, on an iPhone 5, the timestamp is not exactly the same on each event.
   * Futhermore, maybe people are double-tapping or double-clicking. Let's set a threshold and ignore
   * duplicate events within too short a time. For now we'll work with a 200ms threshold.
   */
   return !$eventTarget.data("eventTimeStamp") || ( Math.abs(event.timeStamp - $eventTarget.data("eventTimeStamp")) >= 200 );
};

window.FashioncraftDesigner.Utilities.ShowPhotoNav = function(){
   window.FashioncraftDesigner.Timers.GSAPNavHiding = setInterval( function(){
      if ( typeof( window.FashioncraftDesigner.Flags.GSAPNavHiding ) != "undefined" && window.FashioncraftDesigner.Flags.GSAPNavHiding == false ) {
         clearInterval( window.FashioncraftDesigner.Timers.GSAPNavHiding );
         jQuery(".active-btns").trigger("change");
         TweenLite.to("#fullNav,#fullPhotoNav,.ChangeLabelType", window.FashioncraftDesigner.Settings.GSAPTransitionSpeeds.NavShowHide, {
            css: {
               opacity: "1"
            },
            onComplete: function(){
               jQuery(".active-btns label").first().click();
            }
         });
      }
   }, 10 );
};

window.FashioncraftDesigner.Utilities.OpacityFade = function( $el, FadeTo ){
   /* because I got tired of rewriting this switch */
   switch( window.FashioncraftDesigner.Settings.AnimationMethod ) {
   case "jQuery":
   case "CSS3":
      $el.animate({ opacity: FadeTo });
      break;
   case "GSAP":
      TweenLite.to( $el, window.FashioncraftDesigner.Settings.GSAPTransitionSpeeds.Fade, {
         css: {
            opacity: FadeTo
         }
      });
      break;
   case false:
      $el.css("opacity",FadeTo);
      break;
   }
};

window.FashioncraftDesigner.Utilities.SwitchLabelTypes = function() {
    if (jQuery('.switch-btn').hasClass('switch-left')) {
        jQuery('.switch-btn').removeClass('switch-left').addClass('switch-right').animate({
            left: '75px'
        }, 200);
        var $ClickedElement = jQuery('.ChangeLabelType-Photo');
    } else {
        jQuery('.switch-btn').removeClass('switch-right').addClass('switch-left').animate({
            left: '0px'
        }, 200);
        var $ClickedElement = jQuery('.ChangeLabelType-DYO');
    }

    window.FashioncraftDesigner.Flags.GSAPNavHiding = true;
    // check which button was clicked and assign the active class
    if ($ClickedElement.hasClass("ChangeLabelType-DYO")) {
        // clicked 'design your own'
        jQuery('#fullPhotoNav').removeClass('active-btns');
        jQuery('#fullNav').addClass('active-btns');
        if (jQuery('.label .textLine1').hasClass('blackBackdrop')) {
            window.FashioncraftDesigner.Settings.savedBackdrop = 'blackBackdrop';
        } else if (jQuery('.label .textLine1').hasClass('whiteBackdrop')) {
            window.FashioncraftDesigner.Settings.savedBackdrop = 'whiteBackdrop';
        }
        jQuery('.label .textLine1, .label .textLine2, .label .textLine3').removeClass('blackBackdrop whiteBackdrop');
        // if savedLayout is set, add that class, otherwise just add layout-A:
        if (typeof window.FashioncraftDesigner.Settings.savedLayout !== undefined) {
            jQuery('.label').removeClass('layout-P').addClass(window.FashioncraftDesigner.Settings.savedLayout);
        } else {
            jQuery('.label').removeClass('layout-P').addClass('layout-A');
        }
    }
    else {
        // clicked 'photo upload'
        jQuery('#fullNav').removeClass('active-btns');
        jQuery('#fullPhotoNav').addClass('active-btns');
        // if layout-A or layout-B is found, save it to savedLayout
        if (jQuery('.label').hasClass('layout-A')) {
            window.FashioncraftDesigner.Settings.savedLayout = 'layout-A';
        } else if (jQuery('.label').hasClass('layout-B')) {
            window.FashioncraftDesigner.Settings.savedLayout = 'layout-B';
        }
        jQuery('.label').removeClass('layout-A layout-B').addClass('layout-P');
        // re-apply text color & backdrop options when switching back to photo
        if (typeof window.FashioncraftDesigner.Settings.savedBackdrop !== undefined) {
            jQuery('.label .textLine1, .label .textLine2, .label .textLine3').addClass(window.FashioncraftDesigner.Settings.savedBackdrop);
            // show corresponding text color:
            switch (window.FashioncraftDesigner.Settings.savedBackdrop) {
                case "blackBackdrop":
                    window.FashioncraftDesigner.CurrentChoices.TextLine1ColorHexCode = "White";
                    window.FashioncraftDesigner.CurrentChoices.TextLines2And3ColorHexCode = "White";
                    jQuery(".label .textLine1").css("color", window.FashioncraftDesigner.CurrentChoices.TextLine1ColorHexCode);
                    jQuery(".label .textLine2,.label .textLine3").css("color", window.FashioncraftDesigner.CurrentChoices.TextLines2And3ColorHexCode);
                    break;
                case "whiteBackdrop":
                    window.FashioncraftDesigner.CurrentChoices.TextLine1ColorHexCode = "Black";
                    window.FashioncraftDesigner.CurrentChoices.TextLines2And3ColorHexCode = "Black";
                    jQuery(".label .textLine1").css("color", window.FashioncraftDesigner.CurrentChoices.TextLine1ColorHexCode);
                    jQuery(".label .textLine2,.label .textLine3").css("color", window.FashioncraftDesigner.CurrentChoices.TextLines2And3ColorHexCode);
                    break;
            }
        }
    }
    jQuery(".active-btns").trigger("change");

    TweenLite.to("#fullNav,#fullPhotoNav", window.FashioncraftDesigner.Settings.GSAPTransitionSpeeds.NavShowHide, {
        css: {
            opacity: "0"
        },
        onComplete: function() {
            window.FashioncraftDesigner.Flags.GSAPNavHiding = false;

            // these changes are always made regardless of which button they clicked
            //jQuery(".ChangeLabelType-Photo,.ChangeLabelType-DYO").removeClass("ui-state-active");
            jQuery(".PhotoEnabledLabel").removeClassRegex(/^PhotoLabelStyle-/);

            // now determine which button was clicked and then show the appropriate nav type
            if ($ClickedElement.hasClass("ChangeLabelType-DYO")) {
                // design your own
                jQuery(".PhotoEnabledLabel").addClass("PhotoLabelStyle-DYO");
                jQuery('#canvas').removeClass('photoCanvas').removeClass('PhotoTextShadow_White').removeClass('PhotoTextShadow_Black');
            } else {
                // photo upload
                jQuery(".PhotoEnabledLabel").addClass("PhotoLabelStyle-Photo");
                jQuery('#canvas').addClass('photoCanvas');

                if (false) {
                    // TODO: determine which one of these to add, depending on the current text color choice
                    jQuery('#canvas').addClass("PhotoTextShadow_White");
                    //jQuery('#canvas').addClass('PhotoTextShadow_Black');
                }
            }

            // finally, show the appropriate nav (this will also automatically click the first button)
            window.FashioncraftDesigner.Utilities.ShowPhotoNav();
        }
    });

    // lastly see if we should show or hide text color options:
    window.FashioncraftDesigner.LocalUtilities.AdjustTextColorChoiceVisibility();

}; // end SwitchLabelTypes()

window.FashioncraftDesigner.Utilities.StopThumbnailAnimation = function( el, AnimationID ){
   /* note that AnimationID is optional, but is usually passed. It's expected that AnimationID will
   * match one of the ID's in the dataset, but who knows, it could be different if something weird happened.
   */
   if ( typeof( AnimationID ) != "undefined" ) {
      window.clearInterval( AnimationID );
   }
   if ( typeof( el.dataset.DesignTextAnimationIntervalID ) != "undefined" ) {
      window.clearInterval( el.dataset.DesignTextAnimationIntervalID );
   }
   if ( typeof( el.dataset.PhraseAnimationIntervalID ) != "undefined" ) {
      window.clearInterval( el.dataset.PhraseAnimationIntervalID );
   }
   if ( window.FashioncraftDesigner.Utilities.$.hasClass( el, 'animationInProgress' ) ) {
      window.FashioncraftDesigner.Utilities.$.removeClass( el, 'animationInProgress' );
   }
   el.innerHTML = "";
};

window.FashioncraftDesigner.Utilities.AnimateThumbnailText = function() {
   let AnimatedThumbnails = document.querySelectorAll( "p.ThumbnailAnimatingText");
   for ( var i = 0; i < AnimatedThumbnails.length; ++i ) {
      let TextProperties = JSON.parse(AnimatedThumbnails[i].dataset.text);
      AnimatedThumbnails[i].style.top = TextProperties.Top;
      AnimatedThumbnails[i].style.left = TextProperties.Left;
      AnimatedThumbnails[i].style.color = TextProperties.Color;
      AnimatedThumbnails[i].style.fontFamily = TextProperties.Font;
      if ( TextProperties.FontSize.indexOf("|") != -1 ) {
         /* this is probably a 3-letter monogram with a larger center letter
         * the first font size is for the outer letters, and the second size is
         * for the middle letter, which we'll need a span for later
         */
         let FontSize = TextProperties.FontSize.split("|");
         AnimatedThumbnails[i].style.fontSize = FontSize[0];
         AnimatedThumbnails[i].dataset.CenterLetterFontSize = FontSize[1];
      } else {
         AnimatedThumbnails[i].style.fontSize = TextProperties.FontSize;
      }
      AnimatedThumbnails[i].style.textAlign = TextProperties.TextAlign;
      AnimatedThumbnails[i].style.width = TextProperties.Width;
      AnimatedThumbnails[i].style.transform = TextProperties.Transform;
      if ( typeof( TextProperties.LetterSpacing ) != "undefined" ) {
         AnimatedThumbnails[i].style.letterSpacing = TextProperties.LetterSpacing;
      }
   }

   if ( jQuery("p.ThumbnailAnimatingText").length ) {
      // we only do this on browsers that support IntersectionObserver & have searchable designs

      if ( "IntersectionObserver" in window && "IntersectionObserverEntry" in window && "intersectionRatio" in window.IntersectionObserverEntry.prototype ) {
         // hmm.. IntersectionObserver is supported.. let's use it

         const config = {
            threshold: 0
         };

         // The observer for the images on the page
         let observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
               // Are we in viewport?
               if ( entry.intersectionRatio >= 0.05 ) {
                  /* The object is in view, let's start the animation */
                  /* 2017-12-08: no matter what, start by clearing the element contents, and any
                  * intervals that are currently running on this element. There shouldn't be any
                  * running intervals, but sometimes there are, for no explicable reason.
                  */
                  window.FashioncraftDesigner.Utilities.StopThumbnailAnimation( entry.target );

                  // now proceed with starting the animation
                  let TextProperties = JSON.parse(entry.target.dataset.text);
                  let TextEntries = TextProperties.Text.split(",");

                  // Set first phrase:
                  var Entry = 0;
                  window.FashioncraftDesigner.Utilities.$.addClass( entry.target, 'animationInProgress' );
                  window.FashioncraftDesigner.Utilities.animateYear(entry.target, TextEntries[Entry]);

                  // loop through each text entry, and "type" it in
                  if ( true ) {
                     var designTextAnimation = window.setInterval(function() {
                        entry.target.dataset.DesignTextAnimationIntervalID = designTextAnimation;
                        if ( window.FashioncraftDesigner.Utilities.$.hasClass( entry.target, 'animationInProgress' ) ) {
                           if ( entry.target.textContent == TextEntries[Entry] ) {
                              entry.target.innerHTML = "";
                              if( Entry == TextEntries.length - 1){
                                 Entry = 0;
                              } else {
                                 Entry++;
                              }
                              window.FashioncraftDesigner.Utilities.animateYear(entry.target, TextEntries[Entry]);
                           }
                        } else {
                           /* technically we don't have to do anything here. The only thing that removes the .animationInProgress
                           * class is the stop function, which also should have cleared the interval.
                           * But nothing bad happens if we call the stop function again, so let's do it.
                           */
                           window.FashioncraftDesigner.Utilities.StopThumbnailAnimation( entry.target, designTextAnimation );
                        }
                     }, 2000);
                  }
               } else if ( entry.intersectionRatio <= 0.04 ) {
                  /* The object is OUT OF view, STOP the animation */
                  window.FashioncraftDesigner.Utilities.StopThumbnailAnimation( entry.target );
               }
            });
         }, config);

         let objects = document.querySelectorAll( "p.ThumbnailAnimatingText");
         if ( false ) {
            console.log("objects.length: ", objects.length);
         }
         for ( var i = 0; i < objects.length; ++i ) {
            observer.observe( objects[i] );
         }
      }
   }
}; // window.FashioncraftDesigner.Utilities.AnimateThumbnailText = function()

window.FashioncraftDesigner.Utilities.animateYear = function(el, thisPhrase) {
   // Print each letter
   var Letter = 0;
   let EnlargedCenterLetter = typeof( el.dataset.CenterLetterFontSize ) != "undefined";
   var phraseAnimationID = setInterval(function(){
      el.dataset.PhraseAnimationIntervalID = phraseAnimationID;
      if ( window.FashioncraftDesigner.Utilities.$.hasClass( el, 'animationInProgress' ) && thisPhrase[Letter] != undefined ) {
         if ( !EnlargedCenterLetter ) {
            el.textContent = el.textContent + thisPhrase[Letter];
         } else {
            // 2017-12-11: for now, we're just going to assume the 2nd letter is the center letter.
            if ( Letter == 1 ) {
               el.innerHTML = el.innerHTML + "<span style='font-size: " + el.dataset.CenterLetterFontSize + ";'>" + thisPhrase[Letter] + "</span>";
            } else {
               el.innerHTML = el.innerHTML + thisPhrase[Letter];
            }
         }
         Letter++;
      } else {
         clearInterval( phraseAnimationID );
         if ( !window.FashioncraftDesigner.Utilities.$.hasClass( el, 'animationInProgress' ) ) {
            /* technically we don't have to do anything here. The only thing that removes the .animationInProgress
            * class is the stop function, which also should have cleared the interval.
            * But nothing bad happens if we call the stop function again, so let's do it.
            */
            window.FashioncraftDesigner.Utilities.StopThumbnailAnimation( el, phraseAnimationID );
         }
      }
   }, 160 );
};

window.FashioncraftDesigner.Utilities.expandAll = function() {
  var header = jQuery("#fullPanel-Design .panelContent > h3");
  var content = jQuery(header).next('div');

  $(header).removeClass('ui-corner-all').addClass('ui-accordion-header-active ui-corner-top').attr({
    'aria-selected': 'true',
    'tabindex': '0'
  });

  //$('.ui-accordion-header-icon').removeClass(icons.header).addClass(icons.headerSelected);

  $(content).addClass('ui-accordion-content-active').attr({
    'aria-expanded': 'true',
    'aria-hidden': 'false'
  }).show();
  $(this).attr("disabled","disabled");
  $('.close').removeAttr("disabled");
}

window.FashioncraftDesigner.Utilities.collapseAll = function() {
  var header = jQuery("#fullPanel-Design .panelContent > h3");
  var content = jQuery(header).next('div');

  $(header).removeClass('ui-accordion-header-active ui-state-active ui-corner-top').addClass('ui-corner-all').attr({
     'aria-selected': 'false',
     'tabindex': '-1'
  });
  //$('.ui-accordion-header-icon').removeClass(icons.headerSelected).addClass(icons.header);
  $(content).removeClass('ui-accordion-content-active').attr({
     'aria-expanded': 'false',
     'aria-hidden': 'true'
  }).hide();
  $(this).attr("disabled","disabled");
  $('.open').removeAttr("disabled");
}


window.FashioncraftDesigner.Utilities.SetEventHandlers = function(){
   // set all your event handlers here
   var lastText;

   window.FashioncraftDesigner.Utilities.AnimateThumbnailText();


   jQuery(document).on('click', '.ThumbnailAnimatingText', function(e){
      // Click sibling 'img' element
      e.stopPropagation();
      jQuery(this).next('img').trigger('click');
   });

   jQuery(".panelContent.DesignSearch").on("scroll", function(event){
      jQuery(".panelContent.DesignSearch").off("scroll");
      window.FashioncraftDesigner.Utilities.OpacityFade( jQuery(".designTop"), 1 );
   }).on("touchstart",function(event){
      jQuery(".graphicSearchBox").blur();
   });

   jQuery('.graphicSearch .fa-search').on('click', function(event){
      jQuery('.graphicSearchBox').focus();
   });

   /* Scroll back to the top of design list */
   jQuery('.designTop').on('click', function() {
      $('.panelContent').animate({
         scrollTop: 0
      }, 400);
   });


   /* Set searchbox value to suggestion text */
   jQuery(document).on("click", ".searchSuggestion", function(event) {
      event.preventDefault();
      var suggestedSearch = $(this).text();
      jQuery(".graphicSearchBox").val( suggestedSearch ).trigger("suggestionKeyup");
      jQuery('.suggestionLabel').slideUp();
      jQuery('.noResultsLabel').remove();
   });

   /* Editable text */
   jQuery('#canvas p.designText, #canvas p.textLine1, #canvas p.textLine2, #canvas p.textLine3').on('keyup', function(event){
      var textLine = event.currentTarget.className;
      /* take the entered text and put it into the textfield and trigger a
      * keyup, so any other necessary keyup functions run
      * NOTE: this messes up the cursor position, so we'll attempt to restore it to where it should be
      * 1. Get current text line and its maximum length
      * 2. Get the current cursor position
      * 3. update the input field and trigger a keyup
      * 4. move the cursor to the start position from before
      */
      if(textLine.indexOf('textLine1') != -1){
         var maxlength = jQuery('.textLine1[type=text]').attr('maxlength');
         var CursorStart = window.getSelection().getRangeAt(0).startOffset;
         jQuery('.textLine1[type=text]').val( $(this).text().substr(0,maxlength) ).keyup();
         window.getSelection().collapse( $(this)[0].firstChild, ( CursorStart > jQuery(this).text().length ? jQuery(this).text().length : CursorStart ) );
      }
      else if(textLine.indexOf('textLine2') != -1){
         var maxlength = jQuery('.textLine2[type=text]').attr('maxlength');
         var CursorStart = window.getSelection().getRangeAt(0).startOffset;
         jQuery('.textLine2[type=text]').val( $(this).text().substr(0,maxlength) ).keyup();
         window.getSelection().collapse( $(this)[0].firstChild, ( CursorStart > jQuery(this).text().length ? jQuery(this).text().length : CursorStart ) );
      }
      else if(textLine.indexOf('textLine3') != -1){
         var maxlength = jQuery('.textLine3[type=text]').attr('maxlength');
         var CursorStart = window.getSelection().getRangeAt(0).startOffset;
         jQuery('.textLine3[type=text]').val( $(this).text().substr(0,maxlength) ).keyup();
         window.getSelection().collapse( $(this)[0].firstChild, ( CursorStart > jQuery(this).text().length ? jQuery(this).text().length : CursorStart ) );
      }
      else if(textLine.indexOf('designText') != -1){
         var maxlength = jQuery('.designText[type=text]').attr('maxlength');
         var CursorStart = window.getSelection().getRangeAt(0).startOffset;
         jQuery('.designText[type=text]').val( $(this).text().substr(0,maxlength) ).keyup();
         window.getSelection().collapse( $(this)[0].firstChild, ( CursorStart > jQuery(this).text().length ? jQuery(this).text().length : CursorStart ) );
      }
   }).on("touchend click",function(event){
      /* for some reason, touch devices don't get a cursor on touch unless we stop propagation of the touchend. Probably
      * because of our blur on general canvas click
      */
      event.stopPropagation();
   });

   window.FashioncraftDesigner.Utilities.$.on = function( el, eventName, handler ){
      if ( el.addEventListener ) {
         el.addEventListener(eventName, handler);
      } else {
         el.attachEvent("on" + eventName, function(){
            handler.call(el);
         });
      }
   };

   jQuery("#canvas input.designText, #canvas input.textLine1, #canvas input.textLine2, #canvas input.textLine3").on("keyup",function(event){
      let TargetClass;
      if ( window.FashioncraftDesigner.Utilities.$.hasClass( this, 'designText' ) ) {
         TargetClass = "designText";
      } else if ( window.FashioncraftDesigner.Utilities.$.hasClass( this, 'textLine1' ) ) {
         TargetClass = "textLine1";
      } else if ( window.FashioncraftDesigner.Utilities.$.hasClass( this, 'textLine2' ) ) {
         TargetClass = "textLine2";
      } else if ( window.FashioncraftDesigner.Utilities.$.hasClass( this, 'textLine3' ) ) {
         TargetClass = "textLine3";
      }
      let TargetEl = document.querySelector( "#fullPanel-Text ." + TargetClass );
      TargetEl.value = this.value;
      window.FashioncraftDesigner.Utilities.$.trigger( TargetEl, "keyup" );
   });

   /* Category button interaction */
   jQuery('.cat-btn').on({
     mouseenter: function(){
       $(this).addClass('ui-state-hover');
     },
     mouseleave: function(){
       $(this).removeClass('ui-state-hover');
     }
   });

   jQuery('.cat-btn').on('click', function() {
     if( window.location.search.indexOf('optionB') != -1 ) {
        //Show all categories and labels:
        if( $(this).hasClass('ui-state-active') ){
           $(this).text(window.FashioncraftDesigner.Settings.storedText);
           $(this).removeClass('ui-state-active');
           $('.panelContent div').show();
           $('.panelContent h3').show();
        }

        //Show this category only:
        else {
           var category = $(this).text();
           $(this).parent().find('.ui-state-active').removeClass('ui-state-active').text(window.FashioncraftDesigner.Settings.storedText);
           $(this).addClass('ui-state-active');
           window.FashioncraftDesigner.Settings.storedText = $(this).text();
           $(this).text('Show All');

           $('.panelContent div').hide();
           $('.panelContent h3').each(function(){
              var panelTitle = $(this);
              if( panelTitle.text().indexOf(category) != -1 ){
                 panelTitle.next('div').slideDown();
                 panelTitle.show();
              }
              else {
                 panelTitle.hide();
              }
           });
        }
     } else {
         var $DesignPanel = jQuery("#fullPanel-Design").is(":visible") ? jQuery("#fullPanel-Design .panelContent") : jQuery("#mobilePanel-Design .panelContent");
         var $ParentPanel = jQuery("#fullPanel-Design").is(":visible") ? jQuery("#fullPanels") : jQuery("#mobilePanels");
         var MatchText;
         var $MatchElement;

         switch( jQuery.trim(jQuery(this).text()).toLowerCase() ) {
         case "wedding":
            MatchText = "Wedding";
            break;
         case "baby":
         case "religious":
            MatchText = "Baby - Religious";
            break;
         case "monograms":
         case "marquee":
            MatchText = "Monograms and Text";
            break;
         case "birthday":
            MatchText = "Birthday - Anniversary - Celebration";
            break;
         case "season":
         case "holiday":
            MatchText = "Holiday";
            break;
         }

         $DesignPanel.find("h3").each(function(){
            if ( jQuery.trim(jQuery(this).text()).toLowerCase() == MatchText.toLowerCase() ) {
               $MatchElement = jQuery(this);
            }
         })

         //console.log( $MatchElement );
         //console.log( $MatchElement.position().top );

         $ParentPanel.scrollTop( $MatchElement.position().top );
      }
   });



   /*** Changes label type (DYO or upload photo) ***/
   /* Display photo upload hint */
   if( window.location.search.indexOf('PhotoUpload') != -1 ){

     window.setTimeout( function(){
       jQuery('#new-feature').show().animate({
         bottom: '0px'
       });
     }, 2000);

     // Show photo upload demo:
     jQuery(document).on('click', '.cta-photo', function(e){
       e.preventDefault();
       jQuery('#new-feature').animate({
         bottom: '-200px'
       }, {
         complete: function(){
           jQuery('#new-feature').hide();
         }
       });
       if( !jQuery('.switch-btn').hasClass('switch-right') ){
         window.FashioncraftDesigner.Utilities.SwitchLabelTypes();
       }
       else {
         // already on photo label view
       }
       window.FashioncraftDesigner.Utilities.MobilePanelRollUp( jQuery('.mobilePanel') );
     });

     // Dimiss photo upload hint:
     jQuery(document).on('click', '.dismiss-photo', function(e){
       e.preventDefault();
       jQuery('#new-feature').animate({
         bottom: '-200px'
       }, {
         complete: function(){
           jQuery('#new-feature').hide();
         }
       });
     });

     //Click label type switch:
     jQuery(document).on('click', '.labelTypeSwitch', function(e){
       e.preventDefault();
       window.FashioncraftDesigner.Utilities.SwitchLabelTypes();
     });


   } // if PhotoUpload set


   // design click
   jQuery(document).on("touchend click noHistory", "#fullPanel-Design li img, #mobilePanel-Design li img", function(event){
      event.preventDefault();
      event.stopPropagation();
      var $clickedElement = jQuery(this);
      if ( !window.FashioncraftDesigner.Flags.MobileDragDetected && (!$clickedElement.data("eventTimeStamp") || event.timeStamp != $clickedElement.data("eventTimeStamp")) ) {
         event.stopPropagation();
         $clickedElement.data("eventTimeStamp",event.timeStamp);
         jQuery("#fullPanel-Design li,#mobilePanel-Design li").removeClass("selected");
         $clickedElement.parent().addClass("selected");
         var $parent = $clickedElement.parents(".fullPanel").length ? $clickedElement.parents(".fullPanel") : $clickedElement.parents(".mobilePanel");

         // does this design have a subpanel of colors? if so, show it
         if ( $clickedElement.attr("data-graphicColorID") ) {
            var $panelToShow = $parent.find("." + $clickedElement.attr("data-graphicColorID"));
            if ( !$panelToShow.is(":visible") ) {
               // if the panel has never been shown, and you don't wait a bit, lazy load will get screwed up and not load all images. This workaround fixes the problem
               var waitABit = 0;
               if ( typeof($panelToShow.data("lazyLoadTriggered")) == "undefined" || !$panelToShow.data("lazyLoadTriggered") ) {
                  window.FashioncraftDesigner.Utilities.SetLazyLoad( $panelToShow );
                  $panelToShow.data("lazyLoadTriggered",true);
                  waitABit = 100;
               }
               setTimeout( function(){
                  if ( event.type != "noHistory" && window.FashioncraftDesigner.Settings.AllowSubPanelTransferAnimation ) {
                     // and set one more timeout so the animation animates toward the element's correct location
                     setTimeout( function(){
                        transferOptions = { to: $panelToShow, className: 'FashionCraft-ui-effects-transfer' };
                        $clickedElement.effect( "transfer", transferOptions, 400 );
                     }, 100 );
                  }
                  $panelToShow.show("blind", window.FashioncraftDesigner.Settings.RollSpeed);
               }, waitABit);
            }
            $parent.find(".subPanel:visible").not($panelToShow).hide("blind", window.FashioncraftDesigner.Settings.RollSpeed);
            window.FashioncraftDesigner.Utilities.AdjustSubPanelHeight( $parent.find("." + $clickedElement.attr("data-graphicColorID")) );
         } else if ( !$clickedElement.parents(".graphicColorSubPanel").length ) {
            // this is not a color subpanel. We can hide all color subpanels, trusting that the code above will have run if this design has colors
            $parent.find(".subPanel:visible").hide("blind", window.FashioncraftDesigner.Settings.RollSpeed);
         }

         window.FashioncraftDesigner.LocalEventHandlers.designClick( $clickedElement ); // this MUST be implemented by the labelType's specific js file
         if ( event.type != "noHistory" && $clickedElement.parents("#mobilePanel-Design").length && !$clickedElement.attr("data-graphicColorID") ) {
            // roll up the panel
            window.FashioncraftDesigner.Utilities.MobilePanelRollUp( $clickedElement.parents("#mobilePanel-Design") );
         }
         if ( event.type != "noHistory" ) { window.FashioncraftDesigner.Utilities.PushHistory(); }

         window.FashioncraftDesigner.Utilities.UpdateChosenOptions();
      }
   }).on("touchmove", function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = true; }).on("touchstart",function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = false; });

   // color click
   jQuery(document).on("touchend click noHistory", "#fullPanel-Color li a, #mobilePanel-Color li a", function(event){
      event.preventDefault();
      event.stopPropagation();
      if ( !window.FashioncraftDesigner.Flags.MobileDragDetected && window.FashioncraftDesigner.Utilities.CompareTimestamps( jQuery(this), event ) ) {
         jQuery(this).data("eventTimeStamp",event.timeStamp);
         jQuery("#fullPanel-Color li").removeClass("selected");
         jQuery(this).parent().addClass("selected");
         window.FashioncraftDesigner.LocalEventHandlers.colorClick( jQuery(this) ); // this MUST be implemented by the labelType's specific js file
         if ( event.type != "noHistory" && jQuery(this).parents("#mobilePanel-Color").length ) {
            // roll up the panel
            window.FashioncraftDesigner.Utilities.MobilePanelRollUp( jQuery(this).parents("#mobilePanel-Color") );
         }
         if ( event.type != "noHistory" ) { window.FashioncraftDesigner.Utilities.PushHistory(); }

         window.FashioncraftDesigner.Utilities.UpdateChosenOptions();
      }
   }).on("touchmove", function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = true; }).on("touchstart",function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = false; });

   // text color click
   jQuery(document).on("touchend click noHistory", "#fullPanel-TextColor li a, #mobilePanel-TextColor li a, .textColorSubPanel a", function(event){
      event.preventDefault();
      event.stopPropagation();
      /* NOTE: there are different types of text color options, but we don't have to worry about it here, the local event handler will be responsible for handling them differently.
      * for example, fans and sunglasses get a main option to choose the text color, but ST items get a sub-option under the "Text" panel to choose the text color. This is because
      * fans and sunglasses have many color options, while ST items have just two (black or white).
      * this event handler listens for both types of clicks, and calls the local event handler to take care of the details
      */
      if ( !window.FashioncraftDesigner.Flags.MobileDragDetected && window.FashioncraftDesigner.Utilities.CompareTimestamps( jQuery(this), event ) ) {
         jQuery(this).data("eventTimeStamp",event.timeStamp);
         jQuery("#fullPanel-TextColor li a, #mobilePanel-TextColor li a, .textColorSubPanel a").removeClass("selected");
         if ( jQuery(this).parents(".textColorSubPanel").length ) {
            jQuery(this).addClass("selected");
         } else {
            jQuery(this).parent().addClass("selected");
         }
         window.FashioncraftDesigner.LocalEventHandlers.textColorClick( jQuery(this) ); // this MUST be implemented by the labelType's specific js file
         if ( event.type != "noHistory" && jQuery(this).parents("#mobilePanel-TextColor").length ) {
            // roll up the panel
            window.FashioncraftDesigner.Utilities.MobilePanelRollUp( jQuery(this).parents("#mobilePanel-TextColor") );
         }
         if ( event.type != "noHistory" ) { window.FashioncraftDesigner.Utilities.PushHistory(); }

         window.FashioncraftDesigner.Utilities.UpdateChosenOptions();
      }
   }).on("touchmove", function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = true; }).on("touchstart",function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = false; });

   // font menu change
   jQuery(document).on("change noHistory",".fontSelect", function(event){
      window.FashioncraftDesigner.LocalEventHandlers.fontChange( jQuery(this).find("option:selected") ); // this MUST be implemented by the labelType's specific js file
      if ( event.type != "noHistory" ) { window.FashioncraftDesigner.Utilities.PushHistory(); }
      window.FashioncraftDesigner.Utilities.UpdateChosenOptions();
   });

   // text change
   jQuery(document).data("initialKeyupTriggered",false).on("keyup change","#fullPanel-Text input[type!='radio'], #fullPhotoPanel-Text input[type!='radio'], #mobilePanel-Text input[type!='radio']", function(event){
      if ( !jQuery(document).data("initialKeyupTriggered") ) {
         /* this is the first keyup event. Trigger a keyup on ALL text lines. This will clear any sample
         * text that may be printed at runtime */
         jQuery(document).data("initialKeyupTriggered",true);
         jQuery("#fullPanel-Text input").keyup();
      } else {
         window.FashioncraftDesigner.LocalEventHandlers.textChange( jQuery(this) ); // this MUST be implemented by the labelType's specific js file
         //if ( event.type != "noHistory" ) { window.FashioncraftDesigner.Utilities.PushHistory(); } // let's not log every single keyup as a history step.. this could get annoying
      }

      // one other thing - if this is mobile and they hit the enter key, roll up the panel and close the keyboard
      if ( typeof( event.which ) != "undefined" && event.which == 13 && jQuery("#mobilePanels:visible").length ) {
         jQuery(this).blur().parents().find(".panelHeader").click();
      }
   });

   // pattern click
   jQuery(document).on("touchend click noHistory", "#fullPanel-Pattern .patternSwatches li img, #mobilePanel-Pattern .patternSwatches li img", function(event){
      event.preventDefault();
      event.stopPropagation();
      if ( !window.FashioncraftDesigner.Flags.MobileDragDetected && window.FashioncraftDesigner.Utilities.CompareTimestamps( jQuery(this), event ) ) {
         jQuery(this).data("eventTimeStamp",event.timeStamp);
         jQuery("#fullPanel-Pattern .patternSwatches li,#mobilePanel-Pattern .patternSwatches li").removeClass("selected");
         jQuery(this).parent().addClass("selected");
         window.FashioncraftDesigner.LocalEventHandlers.patternClick( jQuery(this) ); // this MUST be implemented by the labelType's specific js file
         if ( event.type != "noHistory" && jQuery(this).parents("#mobilePanel-Pattern").length ) {
            // roll up the panel
            window.FashioncraftDesigner.Utilities.MobilePanelRollUp( jQuery(this).parents("#mobilePanel-Pattern") );
         }
         if ( event.type != "noHistory" ) { window.FashioncraftDesigner.Utilities.PushHistory(); }

         window.FashioncraftDesigner.Utilities.UpdateChosenOptions();
      }
   }).on("touchmove", function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = true; }).on("touchstart",function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = false; });

   // pattern color click
   jQuery(document).on("touchend click noHistory", "#fullPanel-Pattern .patternColorSwatches li img, #mobilePanel-Pattern .patternColorSwatches li img,#fullPanel-Pattern .patternColorSwatches li a, #mobilePanel-Pattern .patternColorSwatches li a", function(event){
      event.preventDefault();
      event.stopPropagation();
      if ( !window.FashioncraftDesigner.Flags.MobileDragDetected && window.FashioncraftDesigner.Utilities.CompareTimestamps( jQuery(this), event ) ) {
         jQuery(this).data("eventTimeStamp",event.timeStamp);
         jQuery("#fullPanel-Pattern .patternColorSwatches li,#mobilePanel-Pattern .patternColorSwatches li").removeClass("selected");
         jQuery(this).parent().addClass("selected");
         window.FashioncraftDesigner.LocalEventHandlers.patternColorClick( jQuery(this) ); // this MUST be implemented by the labelType's specific js file
         if ( event.type != "noHistory" && jQuery(this).parents("#mobilePanel-Pattern").length ) {
            // roll up the panel
            window.FashioncraftDesigner.Utilities.MobilePanelRollUp( jQuery(this).parents("#mobilePanel-Pattern") );
         }
         if ( event.type != "noHistory" ) { window.FashioncraftDesigner.Utilities.PushHistory(); }

         window.FashioncraftDesigner.Utilities.UpdateChosenOptions();
      }
   }).on("touchmove", function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = true; }).on("touchstart",function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = false; });

   // layout click
   jQuery(document).on("touchend click noHistory", "#fullPanel-Layout .layoutList li img, #mobilePanel-Layout .layoutList li img", function(event){
      event.preventDefault();
      event.stopPropagation();
      if ( !window.FashioncraftDesigner.Flags.MobileDragDetected && window.FashioncraftDesigner.Utilities.CompareTimestamps( jQuery(this), event ) ) {
         jQuery(this).data("eventTimeStamp",event.timeStamp);
         jQuery("#fullPanel-Layout .layoutList li,#mobilePanel-Layout .layoutList li").removeClass("selected");
         jQuery(this).parent().addClass("selected");
         window.FashioncraftDesigner.LocalEventHandlers.layoutClick( jQuery(this) ); // this MUST be implemented by the labelType's specific js file
         if ( event.type != "noHistory" && jQuery(this).parents("#mobilePanel-Layout").length ) {
            // roll up the panel
            window.FashioncraftDesigner.Utilities.MobilePanelRollUp( jQuery(this).parents("#mobilePanel-Layout") );
         }
         if ( event.type != "noHistory" ) { window.FashioncraftDesigner.Utilities.PushHistory(); }

         window.FashioncraftDesigner.Utilities.UpdateChosenOptions();
      }
   }).on("touchmove", function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = true; }).on("touchstart",function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = false; });

   // favorite click
   jQuery(document).on("touchend click noHistory", ".favoriteList li img", function(event){
      event.preventDefault();
      event.stopPropagation();
      if ( !window.FashioncraftDesigner.Flags.MobileDragDetected && window.FashioncraftDesigner.Utilities.CompareTimestamps( jQuery(this), event ) ) {
         jQuery(this).data("eventTimeStamp",event.timeStamp);
         jQuery("#fullPanel-Layout .favoriteList li,#mobilePanel-Layout .favoriteList li").removeClass("selected");
         jQuery(this).parent().addClass("selected");
         window.FashioncraftDesigner.LocalEventHandlers.favoriteClick( jQuery(this) ); // this MUST be implemented by the labelType's specific js file
         if ( event.type != "noHistory" && jQuery(this).parents("#mobilePanel-Layout").length ) {
            // roll up the panel
            window.FashioncraftDesigner.Utilities.MobilePanelRollUp( jQuery(this).parents("#mobilePanel-Layout") );
         }
         if ( event.type != "noHistory" ) { window.FashioncraftDesigner.Utilities.PushHistory(); }

         window.FashioncraftDesigner.Utilities.UpdateChosenOptions();
      }
   }).on("touchmove", function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = true; }).on("touchstart",function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = false; });

   // event handlers and button prep for top nav
   window.FashioncraftDesigner.Utilities.PrepareNavigationButtonsets( "full" );
   window.FashioncraftDesigner.Utilities.PrepareNavigationButtonsets( "fullPhoto" );
   window.FashioncraftDesigner.Utilities.PrepareNavigationButtonsets( "mobile" ); // mobileNav is actually never visible.
   window.FashioncraftDesigner.Utilities.PrepareNavigationButtonsets( "mobilePhoto" ); // mobileNav is actually never visible.
   window.FashioncraftDesigner.Utilities.PreparePhotoUploadButtonset();

   // next button click
   jQuery(document).on("touchend click swipe","#nextPrevious .next", function( event ) {
      event.stopPropagation();
      event.preventDefault();
      //alert("nbc");
      //console.log(event);
      //jQuery("#canvas").append("<br style='clear: both;'>------------<br>nbc");
      //jQuery("#canvas").append("<br>" + event.target.innerHTML);
      //jQuery("#canvas").append("<br>" + event.type);
      if ( window.FashioncraftDesigner.Utilities.CompareTimestamps( jQuery(this), event ) ) {
         window.FashioncraftDesigner.Utilities.HandleNextPrevclick( event, jQuery(this), "next" );
      }
      return false;
   }).on("touchmove", function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = true; }).on("touchstart",function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = false; });

   // previous button click
   jQuery(document).on("touchend click swipe","#nextPrevious .previous", function( event ) {
      event.stopPropagation();
      event.preventDefault();
      if ( window.FashioncraftDesigner.Utilities.CompareTimestamps( jQuery(this), event ) ) {
         window.FashioncraftDesigner.Utilities.HandleNextPrevclick( event, jQuery(this), "prev" );
      }
      return false;
   }).on("touchmove", function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = true; }).on("touchstart",function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = false; });

   // history buttons
   jQuery(document).on("touchend click", ".historyBack:not('.disabled'),.historyForward:not('.disabled')", function( event ) {
      event.preventDefault();
      event.stopPropagation();
      if ( !window.FashioncraftDesigner.Flags.MobileDragDetected && window.FashioncraftDesigner.Utilities.CompareTimestamps( jQuery(this), event ) ) {
         jQuery(this).data("eventTimeStamp",event.timeStamp);

         /* 2017-04: it should never be possible to trigger a history click and NOT have an object as the desired history step (because the buttons are disabled when
         * there are no remaining steps). However, somehow, it has happened. Then the system calls the local ApplyHistoryStep function, which errors out because stepData
         * is not an object. So, the checks below to make sure the relevant step is really an object are meant to prevent this from causing an error. How it happens in
         * the first place is still one of life's unresolved mysteries.
         */
         if ( jQuery(this).hasClass("historyBack") && typeof( window.FashioncraftDesigner.HistorySteps[window.FashioncraftDesigner.CurrentHistoryStep - 1] ) == "object" ) {
            window.FashioncraftDesigner.LocalUtilities.HistoryBackward(); // this MUST be implemented by the labelType's specific js file
            window.FashioncraftDesigner.CurrentHistoryStep--;
            jQuery(".historyForward").removeClass("disabled");
            if ( window.FashioncraftDesigner.CurrentHistoryStep == 0 ) {
               // yes I could just do !window.FashioncraftDesigner.CurrentHistoryStep but I want to be more clear
               jQuery(".historyBack").addClass("disabled");
            }
         } else if ( typeof( window.FashioncraftDesigner.HistorySteps[window.FashioncraftDesigner.CurrentHistoryStep + 1] ) == "object" ) {
            window.FashioncraftDesigner.LocalUtilities.HistoryForward(); // this MUST be implemented by the labelType's specific js file
            window.FashioncraftDesigner.CurrentHistoryStep++;
            jQuery(".historyBack").removeClass("disabled");
            if ( window.FashioncraftDesigner.CurrentHistoryStep == window.FashioncraftDesigner.HistorySteps.length - 1 ) {
               jQuery(".historyForward").addClass("disabled");
            }
         }
      }
   }).on("touchmove", function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = true; }).on("touchstart",function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = false; });

   // submit design
   jQuery(document).on("touchend click",".submitDesign", function( event ) {
      event.preventDefault();
      event.stopPropagation();
      if ( !window.FashioncraftDesigner.Flags.MobileDragDetected && window.FashioncraftDesigner.Utilities.CompareTimestamps( jQuery(this), event ) ) {
         jQuery(this).data("eventTimeStamp",event.timeStamp);
         window.FashioncraftDesigner.LocalUtilities.ValidateDesign(); // this MUST be implemented by the labelType's specific js file
      }
   }).on("touchmove", function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = true; }).on("touchstart",function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = false; });

   // mobile panel header click
   jQuery(document).on("touchend click","#mobilePanels .panelHeader", function( event ) {
      event.preventDefault();
      event.stopPropagation();
      if ( !window.FashioncraftDesigner.Flags.MobileDragDetected && window.FashioncraftDesigner.Utilities.CompareTimestamps( jQuery(this), event ) ) {
         jQuery(this).data("eventTimeStamp",event.timeStamp);
         var $parent = jQuery(this).parent();
         //console.log("parent state = '" + $parent.data("state") + "'");
         //console.log("parent id = '" + $parent.attr("id") + "'");
         if ( $parent.data("state") == "rolledUp" ) {
            //console.log("c1");
            window.FashioncraftDesigner.Utilities.MobilePanelRollDown( $parent );
         } else {
            //console.log("c2")
            window.FashioncraftDesigner.Utilities.MobilePanelRollUp( $parent );
         }
      }
   }).on("touchmove", function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = true; }).on("touchstart",function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = false; });

   // mobile panel full size rolldown click
   jQuery(document).on("touchend click","#mobilePanels .mobilePanelFullRolldown", function( event ) {
      event.stopPropagation();
      event.preventDefault();
      if ( !window.FashioncraftDesigner.Flags.MobileDragDetected && window.FashioncraftDesigner.Utilities.CompareTimestamps( jQuery(this), event ) ) {
         jQuery(this).data("eventTimeStamp",event.timeStamp);
         jQuery(this).parent().find(".panelHeader").click();
      }
      return false;
   }).on("touchmove", function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = true; }).on("touchstart",function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = false; });

   // mobile panel full size rollup click
   jQuery(document).on("touchend click","#mobilePanels .mobilePanelFullRollup", function( event ) {
      event.preventDefault();
      event.stopPropagation();
      if ( !window.FashioncraftDesigner.Flags.MobileDragDetected && window.FashioncraftDesigner.Utilities.CompareTimestamps( jQuery(this), event ) ) {
         jQuery(this).data("eventTimeStamp",event.timeStamp);
         jQuery(this).parent().find(".panelHeader").click();
      }
   }).on("touchmove", function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = true; }).on("touchstart",function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = false; });

   // quantity change
   jQuery(document).on("change keyup",".quantity", function( event ) {
      jQuery(".quantity").not(jQuery(event.target)).val(jQuery(event.target).val());
   });

   // mobile panel swipe
   jQuery(document).on("touchend",".mobilePanel", function( event ) {
      if ( window.FashioncraftDesigner.Flags.MobileDragDetected && window.FashioncraftDesigner.Utilities.CompareTimestamps( jQuery(this), event ) ) {
         jQuery(this).data("eventTimeStamp",event.timeStamp);
         // ok, which way did they swipe?
         var touchObject = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
         var xChange = touchObject.clientX - window.FashioncraftDesigner.Settings.MobilePanelSwipeStartX;

         if ( Math.abs(xChange) > window.FashioncraftDesigner.Settings.MinimumSwipeThreshold ) {
            if ( xChange > 0 ){
               // moved right (back a step)
               jQuery("#nextPrevious .previous").trigger("swipe");
            } else if ( xChange < 0 ){
               // moved left (forward a step).
               jQuery("#nextPrevious .next").trigger("swipe");
            }
         }
      }
   }).on("touchmove", function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = true; }).on("touchstart",function(event){
      window.FashioncraftDesigner.Flags.MobileDragDetected = false;
      var touchObject = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
      window.FashioncraftDesigner.Settings.MobilePanelSwipeStartX = touchObject ? touchObject.clientX : false;
   });

   // general canvas click
   jQuery(document).on("touchend click","#canvasContainer", function( event ) {
      event.preventDefault();
      event.stopPropagation();
      if ( !window.FashioncraftDesigner.Flags.MobileDragDetected && window.FashioncraftDesigner.Utilities.CompareTimestamps( jQuery(this), event ) ) {
         window.FashioncraftDesigner.Utilities.MobilePanelRollUp( jQuery(".mobilePanel:visible") );
      }

      // also trigger a blur event on any text field that may have focus
      jQuery("#canvas p[contenteditable='true']").blur();
   }).on("touchmove", function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = true; }).on("touchstart",function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = false; });

   jQuery(document).on("touchend click",".showChosenOptions", function( event ) {
      event.preventDefault();
      event.stopPropagation();
      if ( !window.FashioncraftDesigner.Flags.MobileDragDetected && (!jQuery(this).data("eventTimeStamp") || event.timeStamp != jQuery(this).data("eventTimeStamp") ) ) {
         jQuery(this).data("eventTimeStamp",event.timeStamp);
         jQuery(".chosenOptions").toggle("fade","fast");
      }
   }).on("touchmove", function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = true; }).on("touchstart",function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = false; });

   jQuery(document).on("touchend",".helpIcon", function( event ) {
      if ( !window.FashioncraftDesigner.Flags.MobileDragDetected && (!jQuery(this).data("eventTimeStamp") || event.timeStamp != jQuery(this).data("eventTimeStamp") ) ) {
         jQuery(this).data("eventTimeStamp",event.timeStamp);
         if ( typeof( jQuery(this).data("open") ) == "undefined" || !jQuery(this).data("open") ) {
            jQuery(this).data("open",true).tooltip("open");
         } else {
            jQuery(this).data("open",false).tooltip("close");
         }
      }
   }).on("touchmove", function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = true; }).on("touchstart",function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = false; });

   // Search box text change
   jQuery(document).on("keyup change search suggestionKeyup", ".graphicSearchBox", function(event){
      var enteredText = jQuery(this).val().toLowerCase().trim();
      window.clearTimeout(window.FashioncraftDesigner.Settings.typingTimer);

      // After 2 seconds of inactivity, save user search:
      if(event.type == 'keyup' || event.type == 'search') {
        window.FashioncraftDesigner.Settings.typingTimer = setTimeout(function(){
          if( enteredText.length >= 3 ){
            jQuery.post('ReceiveTags.php', {searchTerm: enteredText });
          }
        }, 2000);
      }

      if ( enteredText != "" ) {
         $('.panelContent h3, .panelContent div').show();
         $('.cat-btn.ui-state-active').text(window.FashioncraftDesigner.Settings.storedText);
         $('.cat-btn').removeClass("ui-state-active");
         window.FashioncraftDesigner.Utilities.searchDesigns(enteredText);
      } else {
         jQuery(".panelContent").find('h3, li, div.ui-accordion-content-active').show();
         window.FashioncraftDesigner.Utilities.OpacityFade( jQuery(".designTop"), 1 );

         jQuery('.noResultsLabel').remove();
         jQuery('.suggestionLabel').slideUp('fast');

         jQuery('.panelContent h3').each(function() {
            var categoryHeader = jQuery(this);
            categoryHeader.next('div').addClass('ui-accordion-content ui-corner-bottom').css("height","300px").css("overflow-y","scroll");
            jQuery('.ui-accordion-content').not(".ui-accordion-content-active").hide();
         });
      }



      if (event.keyCode === 13 ){
         jQuery(this).blur();
      }
      if(event.type == 'search' && $('.noResultsLabel').is(':visible') ){
         window.FashioncraftDesigner.Utilities.OpacityFade( jQuery(".designTop"), 0 );
      }

   }).on("focus",".graphicSearchBox",function(event){
      jQuery('.designTop').click();
   });

   jQuery(document).on("touchend click highlight",".LocalDesignID_Display", function( event ) {
      event.preventDefault();
      event.stopPropagation();
      if ( !window.FashioncraftDesigner.Flags.MobileDragDetected && (!jQuery(this).data("eventTimeStamp") || event.timeStamp != jQuery(this).data("eventTimeStamp") ) ) {
         //console.log(event);

         // select content
         window.FashioncraftDesigner.Utilities.SelectText("LocalDesignID");

         // copy content
         var SuccessfulCopy = document.execCommand("copy");
         if ( SuccessfulCopy ) {
            alert("Your ID number has been copied to your clipboard, please provide it during checkout.");
         }
      }
   }).on("touchmove", function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = true; }).on("touchstart",function(){ window.FashioncraftDesigner.Flags.MobileDragDetected = false; });

   jQuery(".AdjustTextSize-Buttons").buttonset().find("a").click(function(event){
      //console.log(event.target);
      jQuery(".AdjustTextSize-Buttons a").removeClass("selected");
      jQuery(this).addClass("selected");
      var Adjustment = "Normal";
      if ( jQuery(this).hasClass("AdjustTextSize-Buttons-Small") ) {
         Adjustment = "Small";
      } else if ( jQuery(this).hasClass("AdjustTextSize-Buttons-Big") ) {
         Adjustment = "Big";
      }

      jQuery("#canvas").removeClassRegex(/^FontSizeAdjust-/).addClass("FontSizeAdjust-" + Adjustment);
   });
}; /* SetEventHandlers */



window.FashioncraftDesigner.Utilities.hasOwnProperty = function( obj, prop ){
   // see John Resig's answer here http://stackoverflow.com/a/136411/1042398
   var proto = obj.__proto__ || obj.constructor.prototype;
   return (prop in obj) && (!(prop in proto) || proto[prop] !== obj[prop]);
};

window.FashioncraftDesigner.Utilities.SelectText = function( element ){
   // see https://stackoverflow.com/a/987376/1042398
   var text = document.getElementById(element);
   var range;
   var selection;
   if ( document.body.createTextRange ) {
      range = document.body.createTextRange();
      range.moveToElementText(text);
      range.select();
   } else if ( window.getSelection ) {
      selection = window.getSelection();
      range = document.createRange();
      range.selectNodeContents(text);
      selection.removeAllRanges();
      selection.addRange(range);
   }
};

window.FashioncraftDesigner.Utilities.PushHistory = function() {
   if ( window.FashioncraftDesigner.CurrentHistoryStep < ( window.FashioncraftDesigner.HistorySteps.length - 1 ) ) {
      // the customer must have backtracked, and now they're making a new choice. Erase all entries after the current step
      var deleteCount = window.FashioncraftDesigner.HistorySteps.length - window.FashioncraftDesigner.CurrentHistoryStep;
      window.FashioncraftDesigner.HistorySteps = window.FashioncraftDesigner.HistorySteps.slice(0, deleteCount);
   }
   window.FashioncraftDesigner.HistorySteps.push( jQuery.extend(true, {}, window.FashioncraftDesigner.CurrentChoices) ); // push a copy of the object onto the array
   window.FashioncraftDesigner.CurrentHistoryStep++;
   if ( window.FashioncraftDesigner.CurrentHistoryStep > 0 ) {
      jQuery(".historyBack").removeClass("disabled");
   }
};

window.FashioncraftDesigner.Utilities.EraseHistory = function() {
   window.FashioncraftDesigner.HistorySteps = [];
   window.FashioncraftDesigner.CurrentHistoryStep = -1;
   jQuery(".historyBack,.historyForward").addClass("disabled");
};

window.FashioncraftDesigner.Utilities.InfoBox = function( href, title, parent, dHeight, dWidth, callback, HTMLContent ) {
   // info box to show display boxes, can be used for anything
   // parent can be window, or a jquery element, or a jquery selector
   var infoBoxOptions;
   if ( typeof( dHeight ) == "undefined" || !dHeight ) {
      dHeight = jQuery(parent).height() * .9; // 90% of parent height
   }
   if ( typeof( dWidth ) == "undefined" || !dWidth ) {
      dWidth = jQuery(parent).width() * .9; // 90% of parent width
   }

   if ( !jQuery("#infoBox").is(":ui-dialog") ) {
      jQuery("#infoBox").attr("title",title);
      infoBoxOptions = { bgiframe: true, height: dHeight, width: dWidth, modal: true, show: { effect: "fade", duration: 300 }, position: { my : "center", at : "center", of : parent } };
   } else {
      infoBoxOptions = "open";
      jQuery("#infoBox").dialog( "option", { "title": title, width: dWidth, height: dHeight });
   }

   if ( href ) {
      jQuery("#infoBox").load( href, function(){
         jQuery("#infoBox").dialog( infoBoxOptions );
         if ( typeof( callback ) === "function" ) {
            callback();
         }
      });
   } else if ( HTMLContent ) {
      jQuery("#infoBox").html( HTMLContent );
      jQuery("#infoBox").dialog( infoBoxOptions );
      if ( typeof( callback ) === "function" ) {
         callback();
      }
   }
};

window.FashioncraftDesigner.Utilities.ConfirmBox = function( href, title, parent, dHeight, dWidth, HTMLContent, callback ) {
   // confirm box to show display boxes, can be used for anything
   // parent can be window, or a jquery element, or a jquery selector
   var confirmBoxOptions;
   if ( typeof( dHeight ) == "undefined" || !dHeight ) {
      dHeight = jQuery(parent).height() * .9; // 90% of parent height
   }
   if ( typeof( dWidth ) == "undefined" || !dWidth ) {
      dWidth = jQuery(parent).width() * .9; // 90% of parent width
   }

   if ( !jQuery("#confirmBox").is(":ui-dialog") ) {

      jQuery("#confirmBox").attr("title",title);
      confirmBoxOptions = { bgiframe: true, height: dHeight, width: dWidth, modal: true, show: { effect: "fade", duration: 300 }, position: { my : "center", at : "center", of : parent } };
      confirmBoxOptions.buttons = {
         Cancel: function() {
            window.FashioncraftDesigner.Flags.ValidOnSubmit = false;
            jQuery(this).dialog("close");
         },
         "Continue": function() {
            window.FashioncraftDesigner.Flags.ValidOnSubmit = true;
            jQuery(this).dialog("close");
            if ( typeof( callback ) === "function" ) {
               callback();
            }
         }
      };
   } else {
      confirmBoxOptions = "open";
      jQuery("#confirmBox").dialog( "option", { "title": title, width: dWidth, height: dHeight });
   }

   if ( href ) {
      jQuery("#confirmBox").load( href, function(){
         jQuery("#confirmBox").dialog( confirmBoxOptions );
      });
   } else if ( HTMLContent ) {
      jQuery("#confirmBox").html( HTMLContent );
      jQuery("#confirmBox").dialog( confirmBoxOptions );
   }
};

window.FashioncraftDesigner.Utilities.ChooseAccordionWidgetDefaultTab = function( $accordion ) {
   if ( window.FashioncraftDesigner.Settings.DefaultTab != "" && window.FashioncraftDesigner.Settings.DefaultTab != "Wedding" ) {
      var exactMatchFound = false;
      var partialMatchFound = false;
      $accordion.find("h3").each(function(h3Index){
         if ( jQuery(this).text() == window.FashioncraftDesigner.Settings.DefaultTab ) {
            $accordion.data("defaultTabIndex",h3Index).accordion( "option", "active", h3Index );
            exactMatchFound = true;
         } else if ( !exactMatchFound && jQuery(this).text().toLowerCase().indexOf( window.FashioncraftDesigner.Settings.DefaultTab.toLowerCase() ) != -1 ) {
            $accordion.accordion( "option", "active", h3Index );
            partialMatchFound = true;
         }
      });
   }
};

window.FashioncraftDesigner.Utilities.MarkAccordionWidgetDefaultTab = function( $accordion ) {
   if ( window.FashioncraftDesigner.Settings.DefaultTab != "" && window.FashioncraftDesigner.Settings.DefaultTab != "Wedding" ) {
      var exactMatchFound = false;
      var partialMatchFound = false;
      $accordion.find("h3").each(function(h3Index){
         if ( jQuery(this).text() == window.FashioncraftDesigner.Settings.DefaultTab ) {
            $accordion.data("defaultTabIndex",h3Index);
            exactMatchFound = true;
         } else if ( !exactMatchFound && jQuery(this).text().toLowerCase().indexOf( window.FashioncraftDesigner.Settings.DefaultTab.toLowerCase() ) != -1 ) {
            $accordion.data("defaultTabIndex",h3Index);
            partialMatchFound = true;
         }
      });
   } else {
      $accordion.data("defaultTabIndex",0);
   }
};

window.FashioncraftDesigner.Utilities.ChooseTabWidgetDefaultTab = function( $tabWidget ) {
   if ( window.FashioncraftDesigner.Settings.DefaultTab != "" && window.FashioncraftDesigner.Settings.DefaultTab != "Wedding" ) {
      var exactMatchFound = false;
      var partialMatchFound = false;
      $tabWidget.find("a").each(function(aIndex){
         if ( jQuery(this).text() == window.FashioncraftDesigner.Settings.DefaultTab ) {
            //console.log("found tab");
            $tabWidget.tabs( "option", "active", aIndex );
            exactMatchFound = true;
         } else if ( !exactMatchFound && jQuery(this).text().toLowerCase().indexOf( window.FashioncraftDesigner.Settings.DefaultTab.toLowerCase() ) != -1 ) {
            $tabWidget.tabs( "option", "active", aIndex );
            partialMatchFound = true;
            //console.log("found tab b");
         }
      });
   } else {
      // just click the first one
      $tabWidget.tabs( "option", "active", 0 );
   }
};

window.FashioncraftDesigner.Utilities.MarkTabWidgetDefaultTab = function( $tabWidget ) {
   if ( window.FashioncraftDesigner.Settings.DefaultTab != "" && window.FashioncraftDesigner.Settings.DefaultTab != "Wedding" ) {
      var exactMatchFound = false;
      var partialMatchFound = false;
      $tabWidget.find("a").each(function(aIndex){
         if ( jQuery(this).text() == window.FashioncraftDesigner.Settings.DefaultTab ) {
            //console.log("found tab");
            $tabWidget.data("defaultTabIndex",aIndex);
            exactMatchFound = true;
         } else if ( !exactMatchFound && jQuery(this).text().toLowerCase().indexOf( window.FashioncraftDesigner.Settings.DefaultTab.toLowerCase() ) != -1 ) {
            $tabWidget.data("defaultTabIndex",aIndex);
            partialMatchFound = true;
            //console.log("found tab b");
         }
      });
   } else {
      // just click the first one
      $tabWidget.data("defaultTabIndex",0);
   }
};

window.FashioncraftDesigner.Utilities.DesignPanelInit = function( panel, type, $this ) {
   /* called by design accordion and tab widgets
   * type can be either 'activate' or 'create'
   */
   if ( type == "activate" ) {
      window.FashioncraftDesigner.Utilities.SetLazyLoad( jQuery("#" + panel[0].id) );
   }

   if ( $this.parent().attr("id") == "fullPanel-Design" || $this.parent().attr("id") == "mobilePanel-Design" ) {
      if ( $this.parent().parent().is(":visible") ) {
         jQuery("#" + panel[0].id).find("img.lazyLoad:first").trigger("noHistory"); // click the first visible design
      }
   }

   if ( $this.parents().attr("id") == "mobilePanel-Design" ) {
      $this.css("overflow-y","scroll");
   }

   switch( type ) {
   case "activate":
      //setTimeout( function(){ console.log("length A = '" + jQuery(this).find("img.lazyLoad:visible:first").length + "'" ); jQuery(this).find("img.lazyLoad:visible:first").click(); }, 1000 ); // click the first visible design
      //jQuery("#mobilePanels .mobilePanel").css( "max-height", (jQuery(window).height() * .85) + "px");
      break;
   case "create":
      break;
   }
};

window.FashioncraftDesigner.Utilities.OrdinalSuffixOf = function( integer ) {
   // taken from http://stackoverflow.com/a/13627586/1042398
   // given an integer, returns 'st' 'th' etc as in "1st" or "4th"
   var j = integer % 10;
   var k = integer % 100;

   if ( j == 1 && k != 11 ) {
      return "st";
   }
   if ( j == 2 && k != 12 ) {
      return "nd";
   }
   if ( j == 3 && k != 13 ) {
      return "rd";
   }
   return "th";
}

window.FashioncraftDesigner.Utilities.UpdateChosenOptions = function() {
   if ( jQuery(".chosenOptions").length ) {
      // .chosenOptions only exists if this is not an interactive popup (aka, standard, not standard with autofill)
      jQuery(".chosenOptions").html("");

      for ( var key in window.FashioncraftDesigner.CurrentChoices) {
         if (window.FashioncraftDesigner.CurrentChoices.hasOwnProperty(key)) {
            switch( key ) {
            case "GraphicID":
               // do nothing
               break;
            case "GraphicName":
               jQuery(".chosenOptions").append("<li>Graphic: <span>" + window.FashioncraftDesigner.CurrentChoices[key] + "</span></li>");
               break;
            case "Font":
               jQuery(".chosenOptions").append("<li>Font: <span>" + window.FashioncraftDesigner.CurrentChoices[key] + "</span></li>");
               break;
            case "ColorName":
               jQuery(".chosenOptions").append("<li>Color: <span>" + window.FashioncraftDesigner.CurrentChoices[key] + "</span></li>");
               break;
            case "TextColorName":
               jQuery(".chosenOptions").append("<li>Text Color: <span>" + window.FashioncraftDesigner.CurrentChoices[key] + "</span></li>");
               break;
            case "PatternName":
               jQuery(".chosenOptions").append("<li>Pattern: <span>" + window.FashioncraftDesigner.CurrentChoices[key] + "</span></li>");
               break;
            case "PatternColor":
               jQuery(".chosenOptions").append("<li>Pattern Color: <span>" + window.FashioncraftDesigner.CurrentChoices[key] + "</span></li>");
               break;
            case "BackgroundColorName":
               jQuery(".chosenOptions").append("<li>Background Color: <span>" + window.FashioncraftDesigner.CurrentChoices[key] + "</span></li>");
               break;
            case "BorderColorName":
               jQuery(".chosenOptions").append("<li>Border Color: <span>" + window.FashioncraftDesigner.CurrentChoices[key] + "</span></li>");
               break;
            case "Layout":
               jQuery(".chosenOptions").append("<li>Layout: <span>" + window.FashioncraftDesigner.CurrentChoices[key] + "</span></li>");
               break;
            case "TextLine1ColorName":
               jQuery(".chosenOptions").append("<li>Text Line 1 Color: <span>" + window.FashioncraftDesigner.CurrentChoices[key] + "</span></li>");
               break;
            case "TextLines2And3ColorName":
               jQuery(".chosenOptions").append("<li>Remaining Text Lines - Color: <span>" + window.FashioncraftDesigner.CurrentChoices[key] + "</span></li>");
               break;
            }
         }
      }
   }
};

window.FashioncraftDesigner.Utilities.ElementHasScrollBars = function( element, dimension, computedStyles ) {
   // taken and modified from http://stackoverflow.com/a/39841967/1042398
   // dimension - Either 'y' or 'x'
   // computedStyles - (Optional) Pass in the element's computed styles if you already have it (since I hear its somewhat expensive)
   dimension = dimension.toUpperCase();
   var length = dimension === "Y" ? "Height" : "Width";

   var scrollLength = "scroll" + length;
   var clientLength = "client" + length;
   var overflowDimension = "overflow" + dimension;
   var hasVScroll = element[scrollLength] > element[clientLength];

   // Check the overflow and overflowY properties for "auto" and "visible" values
   var cStyle = computedStyles || getComputedStyle( element );

   return hasVScroll && ( cStyle[overflowDimension] == "visible" || cStyle[overflowDimension] == "auto" ) || cStyle[overflowDimension] == "scroll";
};

window.FashioncraftDesigner.Utilities.CompleteDesign = function( finalChoices ) {
   // you shouldn't need to change this
   finalChoices.LocalDesignID = window.FashioncraftDesigner.Settings.LocalDesignID;
   jQuery.post( window.FashioncraftDesigner.Settings.SaveURL, finalChoices, function( data ) {
      if ( !data || data === "0" ) {
         alert("There was a problem recording your choices. Please enter your choices manually on the product page");
      } else {
         if ( window.FashioncraftDesigner.Settings.DisableInteraction ) {
            /* there is no way for this design window to interact with the product page, perhaps because
            * javascript is blocked on the product page (eBay). We will display the local design ID number to the customer,
            * and tell them to relay that to the store owner
            */
            dHeight = jQuery(window).height() * .9; // 90% of parent height
            dWidth = jQuery(window).width() * .9; // 90% of parent width
            if ( dHeight > 200 ) {
               dHeight = 200;
            }
            if ( dWidth > 400 ) {
               dWidth = 400;
            }
            var HTMLContent = "<div style='font-size: .8em;'>";
            HTMLContent += "<p>Your Design ID Number is:</p>";
            HTMLContent += "<p class='LocalDesignID_Display'><i class='fa fa-files-o' aria-hidden='true'></i> ";
            HTMLContent += "<span id='LocalDesignID'>" + window.FashioncraftDesigner.Settings.LocalDesignID + "</span></p>";
            HTMLContent += "<p>Please click above to copy this ID number. During checkout, paste it into the box provided, which will enable us to retrieve and print your design.</p>";
            HTMLContent += "</div>";
            window.FashioncraftDesigner.Utilities.InfoBox( false, "Your Design Has Been Saved", window, dHeight, dWidth, function(){
               jQuery(".LocalDesignID_Display").trigger("highlight");
            }, HTMLContent );
         } else{
            if ( window.FashioncraftDesigner.Settings.DesignID === "false" ) {
               alert("Your design has been saved. Please return to the product page and click the 'Fill in Options' button");
            }
            if ( window.FashioncraftDesigner.Utilities.GetParameterByName( "closeOnSave" ) == "1" ) {
               // attempt to close window without triggering warnings
               window.open('', '_self');
               window.close();
            }
         }

      }
   });
};

window.FashioncraftDesigner.Utilities.IsiOS = function() {
   // see https://stackoverflow.com/a/9039885/1042398 and https://stackoverflow.com/a/21742107/1042398
   var userAgent = navigator.userAgent || navigator.vendor || window.opera;
   return /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
};

window.FashioncraftDesigner.Utilities.IsMS = function() {
   // see https://stackoverflow.com/questions/31757852/how-can-i-detect-internet-explorer-ie-and-microsoft-edge-using-javascript
   var userAgent = navigator.userAgent || navigator.vendor || window.opera;
   return /MSIE 10/i.test(userAgent) || /MSIE 9/i.test(userAgent) || /rv:11.0/i.test(userAgent) || /Edge\/\d./i.test(userAgent) || navigator.appName == 'Microsoft Internet Explorer';
};

window.FashioncraftDesigner.Utilities.SwapDesignTextThumbnails = function(){
   if ( window.FashioncraftDesigner.Utilities.GetParameterByName( "SwapDesignTextThumbnails" ) == "1" || window.FashioncraftDesigner.Utilities.GetParameterByName( "SwapDesignTextThumbnails" ) == "2" ) {
      var repeat = window.FashioncraftDesigner.Utilities.GetParameterByName( "SwapDesignTextThumbnails" ) == "2";
      try {
         // Get all of the images that are marked up to lazy load
         const images = document.querySelectorAll("#optionPanels li img[data-DesignTextPreviewURL]");
         const config = {
            threshold: 0.6
         };

         // The observer for the images on the page
         let observer = new IntersectionObserver(function(entries){
            entries.forEach( function(entry) {
               // Are we in viewport?
               if (entry.intersectionRatio > 0.6) {
                  // Stop watching
                  observer.unobserve(entry.target);

                  setTimeout( function(){
                     var $el = jQuery(entry.target);
                     $el.fadeTo( 1000 , 0.1, function() {
                        entry.target.setAttribute("src", entry.target.getAttribute("data-DesignTextPreviewURL"));
                        $el.fadeTo( 1000 , 1, function(){
                           if ( repeat ) {
                              $el.fadeTo( 1000 , 0.1, function() {
                                 entry.target.setAttribute("src", entry.target.getAttribute("data-original"));
                                 $el.fadeTo( 1000 , 1, function(){
                                    $el.fadeTo( 1000 , 0.1, function() {
                                       entry.target.setAttribute("src", entry.target.getAttribute("data-DesignTextPreviewURL"));
                                       $el.fadeTo( 1000 , 1 );
                                    });
                                 });
                              });
                           }
                        });
                     });
                  }, 500 );
               }
            });
         }, config);

         for ( var i = 0; i < images.length; ++i ) {
            observer.observe( images[i] );
         }
      } catch( error ) {
         // well, that's unfortunate
         console.log("error detected");
      }
   }
};

jQuery.fn.removeClassRegex = function(regex) {
   // taken from http://stackoverflow.com/a/18621161/1042398
   // usage: $('#hello').removeClassRegex(/^color-/)
   return $(this).removeClass(function(index, classes) {
      return classes.split(/\s+/).filter(function(c) {
         return regex.test(c);
      }).join(' ');
   });
};

// see http://stackoverflow.com/a/10835425/1042398
jQuery.fn.removeClassPrefix = function(prefix) {
   this.each(function(i, el) {
      var classes = el.className.split(" ").filter(function(c) {
         return c.lastIndexOf(prefix, 0) !== 0;
      });
      el.className = jQuery.trim(classes.join(" "));
   });
   return this;
};

/* strangely, there have been situations where jQuery UI is not loaded yet, and the .button() call inside doc ready fails.
* I could put a timer here to wait for jQuery and jQuery.ui to be defined, but chances are if one or both of them are not defined at
* this point, it's because there was a problem loading them from the cdn, and they're never going to be defined. The interface will
* never load, and the timer will run forever (or until the user clicks refresh). Either way, the user will have to click refresh and
* hopefully things will load the 2nd time around, so why bother with a timer..
*/
jQuery(document).ready(function(){

   if ( window.FashioncraftDesigner.Utilities.IsiOS() ) {
      window.FashioncraftDesigner.Settings.AnimationMethod = false;
      jQuery(".With2DTransition").removeClass("With2DTransition");
   } else if ( window.FashioncraftDesigner.Settings.AnimationMethod == "CSS3" ) {
      jQuery(".mobilePanel").addClass("With2DTransition");
   }

   if ( window.FashioncraftDesigner.Settings.AnimationMethod == "GSAP" ) {
      jQuery(".With2DTransition").removeClass("With2DTransition");
   }

   jQuery("#nextPrevious div,.submitDesign,.designTop").button();
   window.FashioncraftDesigner.Utilities.SetEventHandlers();

   jQuery(".jqAccordion").accordion({
      collapsible: true,
      heightStyle: "content",
      active: false,
      activate: function( event, ui ) {
         var panel = typeof( ui.newPanel ) != "undefined" ? ui.newPanel : ui.panel;
         if ( typeof( panel[0] ) != "undefined" ) {
            jQuery("#" + ui.newPanel[0].id).css("overflow-y","scroll");
            window.FashioncraftDesigner.Utilities.DesignPanelInit( panel, "activate", jQuery( this ) );
         }
      },
      create: function( event,ui ) {
         var panel = typeof( ui.newPanel ) != "undefined" ? ui.newPanel : ui.panel;
         window.FashioncraftDesigner.Utilities.MarkAccordionWidgetDefaultTab( jQuery( this ) );
         if ( typeof( panel[0] ) != "undefined" ) {
            window.FashioncraftDesigner.Utilities.ChooseAccordionWidgetDefaultTab( jQuery( this ) );
            window.FashioncraftDesigner.Utilities.DesignPanelInit( panel, "create", jQuery( this ) );
         }
      }
   });

   jQuery(".jqTabs").tabs({
      collapsible: true,
      active: false,
      activate: function( event, ui ) {
         var panel = typeof( ui.newPanel ) != "undefined" ? ui.newPanel : ui.panel;
         if ( typeof( panel[0] ) != "undefined" ) {
            window.FashioncraftDesigner.Utilities.DesignPanelInit( panel, "activate", jQuery( this ) );
         }
      },
      create: function( event, ui ) {
         var panel = typeof( ui.newPanel ) != "undefined" ? ui.newPanel : ui.panel;
         window.FashioncraftDesigner.Utilities.MarkTabWidgetDefaultTab( jQuery( this ) );
         window.FashioncraftDesigner.Utilities.ChooseTabWidgetDefaultTab( jQuery( this ) );
         if ( typeof( panel[0] ) != "undefined" ) {
            window.FashioncraftDesigner.Utilities.DesignPanelInit( panel, "create", jQuery( this ) );
         }
      }
   });

   window.FashioncraftDesigner.Utilities.SetLazyLoad( jQuery(".patternSwatches") );
   /* you can't simply do:
   *** window.FashioncraftDesigner.Utilities.SetLazyLoad( jQuery("div[id*='mobile-Layout']") );
   **** because this sets the mobile layout elements as children of the first matched element, which is fullPane-Layout. Weird, but true.
   **** Then the mobile layout elements never load because their parent never shows. Weird, but true.
   **** So do each one separately
   */
   if ( jQuery("div[id*='Layout']").length ) {
      window.FashioncraftDesigner.Utilities.SetLazyLoad( jQuery("div[id='fullPanel-Layout']") );
      window.FashioncraftDesigner.Utilities.SetLazyLoad( jQuery("div[id='mobilePanel-Layout']") );
   }

   if ( jQuery("div[id*='Favorites']").length ) {
      window.FashioncraftDesigner.Utilities.SetLazyLoad( jQuery("div[id='fullPanel-Favorites']") );
      window.FashioncraftDesigner.Utilities.SetLazyLoad( jQuery("div[id='mobilePanel-Favorites']") );
   }

   // click the first button to show the first panel
   /* 2017-03-15: note that you must also trigger a change of the parent, in case the user has visited this page, and then
   * re-visited it. There's a chance that the click will not trigger a change event, because the browser remembers
   * the previous setting. So, trigger a change as well.
   */
   jQuery(".navigation #fullNav label:first").click().parent().trigger("change");
   jQuery(".navigation #mobileNav label:first").click().parent().trigger("change");
   setInterval( function(){
      //jQuery(".navigation #mobileNav label:first").click().parent().trigger("change");
   }, 1000 );

   window.FashioncraftDesigner.Utilities.SetTooltips();

   jQuery("#nextPrevious .previous").button("disable");

   window.FashioncraftDesigner.Flags.ValidOnSubmit = "pending";
   jQuery(".mobilePanel").addClass("ui-state-default ui-corner-all");

   // perhaps we should make some adjustments if the canvas is scrollable...
   if ( window.FashioncraftDesigner.Utilities.ElementHasScrollBars( jQuery("#canvasContainer")[0], "y" ) && jQuery("#fullPanels:visible").length ) {
      window.FashioncraftDesigner.Utilities.ShowHeaderSubmit();
   }

   // it looks better when the next/previous buttons are the same width
   jQuery("#nextPrevious .next").width( jQuery("#nextPrevious .previous").width() );
   if ( false ) {
      if ( jQuery("#nextPrevious").css("max-width").replace( "px", "") > jQuery("#canvas").width() ) {
         jQuery("#nextPrevious").css({
            "max-width": jQuery("#canvasContainer").width() + "px",
            "width": (jQuery("#canvas").width() * 2) + "px"
         });
      }
   }

   window.FashioncraftDesigner.Utilities.SetDesignTextTooltip();

   window.FashioncraftDesigner.Utilities.SetLazyLoad( jQuery(".panelContent") );

   window.FashioncraftDesigner.Utilities.PrepareScreenshot();
   window.FashioncraftDesigner.Utilities.PrepareCroppie();

   window.FashioncraftDesigner.Utilities.SwapDesignTextThumbnails();

   window.FashioncraftDesigner.Utilities.EraseHistory(); // this should be one of the last things on doc ready
}); // doc ready
