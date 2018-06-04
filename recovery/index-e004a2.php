<?php
	/* How does this whole thing work, and how can you add a new type of label?
	*
	* Here are the steps taken at runtime:
	** 1. designType is determined based on the provided labelType and/or itemNumber
	** 2. using this, the switch below determines what files to include for:
	***** canvas: this is the section where the label is previewed
	***** navFile: this defines what panels will be available on the left side (color, design, text, etc)
	********** the panels defined in the navFile are automatically created as navigation buttons
	********** NOTE: there are two sets of navigation buttons, a full size and a mobile. Both are printed, only one is visible at a time
	***** sidePanels: loops through and prints the panels corresponding to what was defined in navFile
	********** NOTE: there are two sets of panels, one for full size and one for mobile. Both are printed, only one is visible at a time
	********** this defines a a populatePanelXXXXX() function, and then calls the global printPanels() function. That function uses label type to call populatePanelXXXXX()
	********** populatePanelXXXXX() is given a panel type, and connects to the API to determine what should be placed in the panel (color options, pattern options, etc)
	************ it then calls global functions that print the options. ALTERNATIVELY, it may call local functions that print the panels differently for this particular type of label
	***** jsPHP file: this OPTIONAL file outputs javascript but is PHP so we can use server-side code to make life easier
	***** stylesheet: defines the canvas structure, fonts, colors, etc etc. Try to do most changes here, and use javascript just to assign / remove classes
	***** js: the specific javascript file for this label
	***** additionalJS: other javascript files you want to include, this should always be an array, even if there's only one
	*
	* Preparation, Event and User Interaction Handling:
	*** the main.js script is always included. This handles as much as possible of the basic UI creation, and defines event listeners.
	****** the goal is to keep this script as lightweight as possible.
	****** when events are detected, main.js will do some misc global tasks (history, etc) and then it will call a local function to handle the details
	****** the local functions MUST be named correctly and MUST be defined by the label's specific javascript file.
	*** specific js: This is where you can put local functions, and any code that is specific to this label and that would conflict with other labels.
	****** Event handling, local utilities, etc can all be defined here
	*
	*
	* CREATING A NEW LABEL
	*** so, to create a new label, you must add a case to the switch below, and define each of the necessary files:
	****** canvas, navigation, sidePanels, stylesheet, and specific js.
	****** use the canvas + stylesheet to arrange the basic layout, use the navigation + sidePanels to arrange the panels and nav buttons, and
	****** use the specific js to handle the user interaction
	*** REMEMBER: the switch below is based on the appropriate $designType, so if necessary you'll have to create it in the database
	*** AND: you'll have to add the appropriate personalization data to the various tables in the database so the API works.
	*/

	$referringDomain = parse_url($_SERVER['HTTP_REFERER'], PHP_URL_HOST); // gives us 'www.example.com'
	$_REQUEST["labelPrep"] = isset( $_REQUEST["labelPrep"] ) || isset( $_REQUEST["prepLabel"] );
	switch( $referringDomain ) {
	case "www.favorfavor.com":
	case "www.favorfavorbaby.com":
	case "www.nicepricefavors.com":
		header( "Access-Control-Allow-Origin: http://" . $referringDomain );
		break;
	}

  include("../ps/functions.php");
	include("ps/functions.php");
   $database = dbConnect( "pdo" );
   $designType = getDesignType();

  $showAddOnsTab = false;
	$itemNumber = "";
	if ( isset( $_REQUEST["itemNumber"] ) ) {
		$itemNumber = htmlentities( $_REQUEST["itemNumber"] );
	} elseif ( isset( $_REQUEST["glass"] ) ) {
		$itemNumber = htmlentities( $_REQUEST["glass"] );
	} elseif ( isset( $_REQUEST["labelType"] ) && is_numeric( substr( $_REQUEST["labelType"], 0, 4 ) ) ) {
		$itemNumber = htmlentities( $_REQUEST["labelType"] );
	}
   if ( $itemNumber == "test" ) { $itemNumber = "3421s"; }
	if ( $itemNumber != "" ) {
		$itemNumberNumeric = str_replace( array( "-", "_" ), array( "", "" ), getShortCode( $itemNumber ) );
	}

	if ( $itemNumber == "" ) {
		/* we need an item number to determine how many text lines and how many characters...
		* just pick an item that matches the provided labelType..
		*/
		$itemNumber = Designer_GetItemNumber( $designType["labelType"] );
		$itemNumberNumeric = splitAtFirstLetter( $itemNumber );
		$designType["itemNumber"] = $itemNumber;
		$designType["itemNumberNumeric"] = $itemNumberNumeric;
	}

   if ( isset( $_REQUEST["labelType"] ) ) {
      if ( $_REQUEST["labelType"] == "glasswareMonogram" ) {
         $labelType =  "glassware";
      } elseif ( $_REQUEST["labelType"] == "Vintage" ) {
         $labelType =  "vintage";
      } else {
         $labelType =  htmlentities( $_REQUEST["labelType"] );
      }
   } else {
      $labelType = false;
   }

	$jQueryUIVersion = "1.11.4";
	//$jQueryUIVersion = "1.12.1";

   if ( isset( $_REQUEST["jquiThemeURL"] ) ) {
      $jquiThemeURL = htmlentities( $_REQUEST["jquiThemeURL"] );
   } elseif ( isset( $_REQUEST["jquiTheme"] ) ) {
      $jquiThemeURL = "//ajax.aspnetcdn.com/ajax/jquery.ui/" . $jQueryUIVersion . "/themes/" . htmlentities( $_REQUEST["jquiTheme"] ) . "/jquery-ui.css";
   } else {
      $jquiThemeURL = "include/css/libraries/jQuery/jQueryUI-" . $jQueryUIVersion . "/jquery-ui.min.css";
   }

	/********** GETTING VARIOUS PERSONALIZATION / DESIGNER DATA *************/
	/*
   * note that box charges for the FC site are also separately defined in includes/js/functions.js by the
   * setAddOnCharges()
   * function
   */
	$addOnData["itemNumber"] = $itemNumber;
	include( "../utilities/getAddOns.php" ); // defines the $addOns array for us
	$addOnsJSON = json_encode( $addOns );
	if ( $addOns ) {
		//echo "<pre>"; var_dump( $addOns ); echo "</pre>";
		foreach( $addOns as $addOn ) {
			if ( !$showAddOnsTab && $addOn !== false ) {
				//echo "<pre>"; var_dump( $addOn ); echo "</pre>";
				if ( $addOn["itemCode"] == "5112" ) {
					$showAddOnsTab = (time() > strtotime("October 1, 2017")) || (isset( $_REQUEST["BoxCharge"] ));
				} else {
					$showAddOnsTab = true;
				}

			}
		}
	}
	/* are we auto-clicking a particular tab? figure it out and set a javascript flag (later) */
	$defaultTab = designStudioSetDefaultTab( $itemNumber, $_REQUEST["labelType"] );

	$js = false;
	$jsPHP = false;
	$stylesheets = false;

	if ( $_REQUEST["labelPrep"] ) {
		// for debugging
		echo "<br>designType:<br>"; var_dump( $designType );
	}

	$additionalJS[] = "include/js/libraries/GSAP/!Combined.js";
	$additionalJS[] = "include/js/searchCorrections.js";
	$additionalJS[] = "include/js/levenshtein.js";
  $additionalJS[] = "include/js/plugins/haystack/Haystack.js";

	switch( $designType["labelType"] ) {
	case "glassware":
		$canvas = "include/htm/canvas/glassware.php";
		$navFile = "include/htm/nav/glassware.php";
		$sidePanels = "include/htm/sidePanels/glassware.php";
		$jsPHP = "include/js/specific/glassware.js.php";
		$stylesheets[] = "include/css/glassware.css";
		$js = "include/js/specific/glassware.js";
		if ( $itemNumberNumeric == "3211" ) {
			$additionalJS[] = "include/js/plugins/jquery.arctext.js";
		}
		break;
	case "foil":
		switch( $designType["labelShape"] ) {
		case "sandalwoodFan":
		case "blackSunglasses":
		case "sunglasses":
			$canvas = "include/htm/canvas/fansAndSunglasses.php";
			$navFile = "include/htm/nav/fansAndSunglasses.php";
			$sidePanels = "include/htm/sidePanels/fansAndSunglasses.php";
			$stylesheets[] = "include/css/fansAndSunglasses_Foil.css";
			$js = "include/js/specific/fansAndSunglasses.js";
			$additionalJS[] = "include/js/plugins/jquery.textfill.js";
			break;
		case "tt":
		case "c":
			$canvas = "include/htm/canvas/foil/foil.php";
			$navFile = "include/htm/nav/foil/foil.php";
			$sidePanels = "include/htm/sidePanels/foil/foil.php";
			$stylesheets[] = "include/css/foil/foil." . $designType["labelShape"] . ".css";
			$js = "include/js/specific/foil/foil.js";
			break;
		}
		break;
	case "modFoil":
	case "modFoilRectangle":
	case "modFoilRectangleWide":
		switch( $designType["labelType"] ) {
		case "modFoil":
			$screen = array( "path"=>"images/foil/misc/foil-overlay-b.png", "height"=>"252", "width"=>"252" );
			break;
		case "modFoilRectangle":
		case "modFoilRectangleWide":
			$screen = array( "path"=>"images/blank.png", "height"=>"1", "width"=>"1" );
			break;
		}
		$canvas = "include/htm/canvas/foil/modFoil.php";
		$navFile = "include/htm/nav/foil/modFoil.php";
		$sidePanels = "include/htm/sidePanels/foil/modFoil.php";
		//$jsPHP = "include/js/specific/glassware.js.php";
		$stylesheets[] = "include/css/foil/" . $designType["labelType"] . ".css";
		$js = "include/js/specific/foil/modFoil.js";
		break;
	case "visorSunglasses":
		$canvas = "include/htm/canvas/visorSunglasses.php";
		$navFile = "include/htm/nav/visorSunglasses.php";
		$sidePanels = "include/htm/sidePanels/visorSunglasses.php";
		$stylesheets[] = "include/css/visorSunglasses.css";
		$js = "include/js/specific/visorSunglasses.js";
		$screen = array( "path"=>"images/foil/misc/foil-overlay-b.png", "height"=>"252", "width"=>"252" );
		$additionalJS[] = "include/js/plugins/jquery.arctext.js";
		break;
	case "sandalwoodFan":
	case "sunglasses":
	case "pinkSunglasses":
	case "blackSunglasses":
	case "purpleSunglasses":
		$canvas = "include/htm/canvas/fansAndSunglasses.php";
		$navFile = "include/htm/nav/fansAndSunglasses.php";
		$sidePanels = "include/htm/sidePanels/fansAndSunglasses.php";
		$stylesheets[] = "include/css/fansAndSunglasses.css";
		$js = "include/js/specific/fansAndSunglasses.js";
		$additionalJS[] = "include/js/plugins/jquery.textfill.js";
		break;
	case "babyCarriage":
		$canvas = "include/htm/canvas/babyCarriage.php";
		$navFile = "include/htm/nav/babyCarriage.php";
		$sidePanels = "include/htm/sidePanels/babyCarriage.php";
		$stylesheets[] = "include/css/babyCarriage.css";
		$js = "include/js/specific/babyCarriage.js";
		break;
	case "iceCreamScoop":
		$canvas = "include/htm/canvas/iceCreamScoop.php";
		$navFile = "include/htm/nav/iceCreamScoop.php";
		$sidePanels = "include/htm/sidePanels/iceCreamScoop.php";
		$stylesheets[] = "include/css/iceCreamScoop.css";
		$js = "include/js/specific/iceCreamScoop.js";
		break;
	case "monogramStickers":
		$canvas = "include/htm/canvas/ST/monogramStickers.php";
		$navFile = "include/htm/nav/ST/monogramStickers.php";
		$sidePanels = "include/htm/sidePanels/ST/monogramStickers.php";
		$stylesheets[] = "include/css/ST/monogramStickers.css";
		$js = "include/js/specific/ST/monogramStickers.js";
		break;
	case "monogramStickersRectangle":
		$canvas = "include/htm/canvas/ST/monogramStickersRectangle.php";
		$navFile = "include/htm/nav/ST/monogramStickersRectangle.php";
		$sidePanels = "include/htm/sidePanels/ST/monogramStickersRectangle.php";
		$stylesheets[] = "include/css/ST/monogramStickersRectangle.css";
		$js = "include/js/specific/ST/monogramStickersRectangle.js";
		break;
	case "vintageRectangle":
		$canvas = "include/htm/canvas/ST/vintageRectangle.php";
		$navFile = "include/htm/nav/ST/vintageRectangle.php";
		$sidePanels = "include/htm/sidePanels/ST/vintageRectangle.php";
		$stylesheets[] = "include/css/ST/vintageRectangle.css";
		$js = "include/js/specific/ST/vintageRectangle.js";
		break;
	case "vintage":
		$canvas = "include/htm/canvas/ST/vintage.php";
		$navFile = "include/htm/nav/ST/vintage.php";
		$sidePanels = "include/htm/sidePanels/ST/vintage.php";
		$stylesheets[] = "include/css/ST/vintage.css";
		$js = "include/js/specific/ST/vintage.js";
		break;
	case "wanderlustRectangle":
		$canvas = "include/htm/canvas/ST/wanderlustRectangle.php";
		$navFile = "include/htm/nav/ST/wanderlustRectangle.php";
		$sidePanels = "include/htm/sidePanels/ST/wanderlustRectangle.php";
		$stylesheets[] = "include/css/ST/wanderlustRectangle.css";
		$js = "include/js/specific/ST/wanderlustRectangle.js";
		break;
	case "wanderlust":
		$canvas = "include/htm/canvas/ST/wanderlust.php";
		$navFile = "include/htm/nav/ST/wanderlust.php";
		$sidePanels = "include/htm/sidePanels/ST/wanderlust.php";
		$stylesheets[] = "include/css/ST/wanderlust.css";
		$js = "include/js/specific/ST/wanderlust.js";
		break;
	case "tt":
	case "c":
	case "cs":
	case "cl":
	case "pb":
	case "mk":
	case "lt":
	case "lbt":
	case "mt":
	case "": // wide rectangle
	case "plaque":
	case "matchbooks":
	case "diamond":
	case "t":
		$canvas = "include/htm/canvas/ST/!ST.php";
		$sidePanels = "include/htm/sidePanels/ST/!ST.php";
		$stylesheets[] = "include/css/ST/!!ST.css";
		$js = "include/js/specific/ST/!!ST.js";

		// there are three main ST nav files we can use (designating step 1: layout, favorites, or nothing). Choose the appropriate one
		// also choose secondary stylesheets, misc overrides, etc
		switch( $designType["labelType"] ) {
		case "tt":
			$navFile = "include/htm/nav/ST/!ST.layout.php";
			$stylesheets[] = "include/css/ST/!ST.tt.css";
			$additionalJS[] = "include/js/specific/ST/!ST.tt.js";
			break;
		case "c":
			$navFile = "include/htm/nav/ST/!ST.favorites.php";
			$stylesheets[] = "include/css/ST/!ST.c.css";
			$additionalJS[] = "include/js/specific/ST/!ST.c.js";
			break;
		case "cs":
			$navFile = "include/htm/nav/ST/!ST.favorites.php";
			$stylesheets[] = "include/css/ST/!ST.cs.css";
			$additionalJS[] = "include/js/specific/ST/!ST.c.js";
			break;
		case "cl":
			$navFile = "include/htm/nav/ST/!ST.favorites.php";
			$stylesheets[] = "include/css/ST/!ST.cl.css";
			$additionalJS[] = "include/js/specific/ST/!ST.cl.js";
			break;
		case "pb":
			$navFile = "include/htm/nav/ST/!ST.favorites.php";
			$stylesheets[] = "include/css/ST/!ST.pb.css";
			$additionalJS[] = "include/js/specific/ST/!ST.cl.js";
			break;
		case "mk":
			$navFile = "include/htm/nav/ST/!ST.favorites.php";
			$stylesheets[] = "include/css/ST/!ST.mk.css";
			$additionalJS[] = "include/js/specific/ST/!ST.cl.js";
			break;
		case "lt":
			$navFile = "include/htm/nav/ST/!ST.favorites.php";
			$stylesheets[] = "include/css/ST/!ST.lt.css";
			$additionalJS[] = "include/js/specific/ST/!ST.cl.js";
			break;
		case "lbt":
			$navFile = "include/htm/nav/ST/!ST.favorites.php";
			$stylesheets[] = "include/css/ST/!ST.lbt.css";
			$additionalJS[] = "include/js/specific/ST/!ST.cl.js";
			break;
		case "mt":
			$navFile = "include/htm/nav/ST/!ST.favorites.php";
			$stylesheets[] = "include/css/ST/!ST.mt.css";
			$additionalJS[] = "include/js/specific/ST/!ST.cl.js";
			break;
		case "": // wide rectangle
			$navFile = "include/htm/nav/ST/!ST.layout.php";
			$stylesheets[] = "include/css/ST/!ST.wideRectangle.css";
			$additionalJS[] = "include/js/specific/ST/!ST.tt.js";
			break;
		case "plaque":
			$navFile = "include/htm/nav/ST/!ST.favorites.php";
			$stylesheets[] = "include/css/ST/!ST.plaque.css";
			$additionalJS[] = "include/js/specific/ST/!ST.cl.js";
			break;
		case "matchbooks":
			$navFile = "include/htm/nav/ST/!ST.noLayoutsOrFavorites.php";
			$stylesheets[] = "include/css/ST/!ST.matchbooks.css";
			$additionalJS[] = "include/js/specific/ST/!ST.cl.js";
			break;
		case "diamond":
			$navFile = "include/htm/nav/ST/!ST.noLayoutsOrFavorites.php";
			$stylesheets[] = "include/css/ST/!ST.diamond.css";
			$additionalJS[] = "include/js/specific/ST/!ST.cl.js";
			break;
		case "t":
			$navFile = "include/htm/nav/ST/!ST.t.php";
			$stylesheets[] = "include/css/ST/!ST.t.css";
			$additionalJS[] = "include/js/specific/ST/!ST.cl.js";
			break;
		}
		break;
	case "12054":
	case "12113":
	case "12053":
	case "12021":
		$canvas = "include/htm/canvas/screenPrintedText.php";
		$navFile = "include/htm/nav/screenPrintedText.php";
		$sidePanels = "include/htm/sidePanels/screenPrintedText.php";
		$stylesheets[] = "include/css/screenPrintedText.css";
		$js = "include/js/specific/screenPrintedText.js";
		break;
	case "chalkboard":
		switch( $designType["labelShape"] ) {
		case "tt":
		case "c":
			$canvas = "include/htm/canvas/chalkboard.php";
			$navFile = "include/htm/nav/chalkboard.php";
			$sidePanels = "include/htm/sidePanels/chalkboard.php";
			$stylesheets[] = "include/css/foil/foil." . $designType["labelShape"] . ".css";
			$stylesheets[] = "include/css/chalkboard.css";
			$js = "include/js/specific/foil/foil.js";
			break;
		}
		break;
	case "engraved":
		$canvas = "include/htm/canvas/engraved/engraved.php";
		$navFile = "include/htm/nav/engraved.php";
		$sidePanels = "include/htm/sidePanels/engraved.php";
		$stylesheets[] = "include/css/engraved.css";
		$js = "include/js/specific/engraved.js";
		break;
	case "ccWideRectangle":
		$canvas = "include/htm/canvas/ccWideRectangle.php";
		$navFile = "include/htm/nav/ccWideRectangle.php";
		$sidePanels = "include/htm/sidePanels/ccWideRectangle.php";
		$stylesheets[] = "include/css/ccWideRectangle.css";
		$js = "include/js/specific/ccWideRectangle.js";
		break;
	case "simplyStylish":
		switch( $designType["labelShape"] ) {
		case "tt":
			/* as of 2017-04-21, this is the only type */
			$canvas = "include/htm/canvas/simplyStylish.php";
			$navFile = "include/htm/nav/simplyStylish.php";
			$sidePanels = "include/htm/sidePanels/simplyStylish.php";
			$stylesheets[] = "include/css/simplyStylish.css";
			$js = "include/js/specific/simplyStylish.js";
			break;
		}
		break;
	case "CoffeeTumbler":
		$canvas = "include/htm/canvas/CoffeeCups/Tumbler.php";
		$navFile = "include/htm/nav/CoffeeCups/Tumbler.php";
		$sidePanels = "include/htm/sidePanels/CoffeeCups/Tumbler.php";
		$stylesheets[] = "include/css/CoffeeCups/Tumbler.css";
		$js = "include/js/specific/CoffeeCups/Tumbler.js";
		break;
	}

	$defaultQuantity = isset( $_REQUEST["quantity"] ) && is_numeric( $_REQUEST["quantity"] ) ? (int)$_REQUEST["quantity"] : "";

	$GLOBALS["defaultQuantity"] = $defaultQuantity;
	$GLOBALS["UploadYourOwn"] = isset( $_REQUEST["PhotoUpload"] );
	$GLOBALS["DesignSearch"] = isset( $_REQUEST["DesignSearch"] );
	$GLOBALS["UseInputFieldsForTextDisplay"] = isset( $_REQUEST["InputText"] );

	if ( $GLOBALS["UploadYourOwn"] ) {
		$stylesheets[] = "include/js/plugins/jcrop/css/jquery.Jcrop.min.css";
		$stylesheets[] = "include/js/plugins/croppie/css/croppie.css";
		$additionalJS[] = "include/js/ImageUpload.js";
		$additionalJS[] = "include/js/plugins/jquery.form.min.js";
		$additionalJS[] = "include/js/plugins/jcrop/js/jquery.Jcrop.min.js";
		$additionalJS[] = "include/js/plugins/html2canvas.min.js";
		$additionalJS[] = "include/js/plugins/croppie/js/croppie.js";
	}
	if( isset($_REQUEST["canvasScreenshot"]) ){
		$stylesheets[] = "include/js/plugins/jcrop/css/jquery.Jcrop.min.css";
		$additionalJS[] = "include/js/ImageUpload.js";
		$additionalJS[] = "include/js/plugins/jquery.form.min.js";
		$additionalJS[] = "include/js/plugins/jcrop/js/jquery.Jcrop.min.js";
		$additionalJS[] = "include/js/plugins/html2canvas.min.js";
	}

	if ( $designType["itemNumber"] ) {
		$customFieldIDs["minQuantity"] = getCustomProdFieldID( "minQuantity", $database, "pdo" );
		$minQuantity = getCustProdField( "minQuantity", $customFieldIDs["minQuantity"], $designType["itemNumber"], false, "pdo", $database );
		if ( $_REQUEST["labelPrep"] ) { echo "<br>minQuantity = '" . $minQuantity . "'"; }
		if ( strpos( $minQuantity, "^" ) !== false ) {
			// we need to build a dropdown menu for the quantity
			$minQuantity = explode( "^", $minQuantity );
			$GLOBALS["quantityMenu"] = array( "start"=>$minQuantity[0], "increment"=>$minQuantity[1], "max"=>$minQuantity[2] );
		} else {
			$GLOBALS["quantityMenu"] = false;
		}
	}
	if ( false && $_REQUEST["labelPrep"] ) {
		echo "<br>GLOBALS:<br>"; var_dump( $GLOBALS );
	}

	if ( isset( $_REQUEST["edid"] ) ) {
		// edid = Existing Design ID
		/* if this exists, the customer has designed this label previously. Attempt to retrieve their prior setting
		*/
		if ( $designData = Designer_RetrieveDesign( $database, $_REQUEST["edid"] ) ) {
			$designDataJSON = Designer_ConvertArrayToJSON( $designData[0] );
			if ( !Designer_IsJSON( $designDataJSON ) ) {
				unset( $designDataJSON );
			}
		}
	}

	$DisableInteraction = isset( $_REQUEST["DisableInteraction"] ) ? "true" : "false";
	$DesignID = isset( $_REQUEST["id"] ) ? htmlentities( $_REQUEST["id"] ) : "false";
	$LocalDesignID = $itemNumberNumeric . "|" . time() . "|" . rand(1,9999999999);
	$SubmitDesignText = $DisableInteraction == "true" ? "Save" : "Submit";
?>

<?php /* we used to only include doctype, <html> tag, etc if $_REQUEST["standard"] was set. But now it should always be set, so don't bother testing */ ?>
<!doctype html>
<html lang="en">
<head>
   <meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
   <title>Design Your Item</title>

   <link type="text/css" rel="stylesheet" href="<?php echo $jquiThemeURL; ?>">
   <link type="text/css" rel="stylesheet" href="//maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css" class="fontAwesome">
   <link type="text/css" rel="stylesheet" href="//www.fashioncraft.com/include/css/fonts.css" class="fonts">
   <link type="text/css" rel="stylesheet" href="include/css/main.css" class="mainStyles">

   <?php
		if ( $stylesheets ) {
			foreach( $stylesheets as $stylesheet ) {
				?><link type="text/css" rel="stylesheet" href="<?php echo $stylesheet; ?>"><?php
			}
		}
   ?>

	<script type="text/javascript" src="include/js/libraries/respond.js"></script>
   <script type="text/javascript" src="include/js/libraries/jQuery/jquery-1.12.4.min.js"></script>
	<?php if ( true ) { ?>
   	<script type="text/javascript" src="include/js/libraries/jQuery/jQueryUI-1.11.4/jquery-ui.min.js"></script>
	<?php } else { ?>
   	<script type="text/javascript" src="include/js/libraries/jQuery/jQueryUI-1.12.1/jquery-ui.min.js"></script>
	<?php } ?>
   <script src="https://cdn.ravenjs.com/3.13.1/raven.min.js"></script>
   <script type="text/javascript">
      Raven.config('https://f2f6e75c36484ec2a482ccc8693fafcf@sentry.io/153736', {
         autoBreadcrumbs: {
            console: false
         }
      }).install();
   </script>

	<?php if ( isset( $_REQUEST["Test"] ) ) { ?>
		<script type="text/javascript" src="include/js/main.test.js"></script>
		<script type="text/javascript" src="include/js/plugins/jquery.lazyload.modified.js"></script>
	<?php } else { ?>
		<script type="text/javascript" src="include/js/main.js"></script>
		<script type="text/javascript" src="include/js/plugins/jquery.lazyload.js"></script>
	<?php } ?>

   <script type="text/javascript">
      //window.fashioncraftDebug = true;
		<?php if ( $_REQUEST["labelPrep"] ) { ?>
			window.FashioncraftDesigner.Settings.labelPrep = true;
			window.FashioncraftDesigner.Settings.prepLabel = true;
		<?php } ?>
		<?php /*
			* NOTE: sometimes sentry reports an error here, basically that window.FashioncraftDesigner doesn't exist. It's defined
			* in include/js/main.js, which is purposely loaded as a blocking script, so NOTHING else (including this) should run until
			* after it loads, or fails to load. So if you get an error here that window.FashioncraftDesigner doesn't exist, it means
			* include/js/main.js completely failed to load. If that happened, the whole designer is screwed.
			* So, don't bother putting an interval here to wait for window.FashioncraftDesigner to be defined. If it's not defined yet,
			* it's never going to be defined. This customer is just going to have to refresh the page...
			* ALTERNATIVELY: you could put an interval and wait let's say 30 seconds, and if it still hasn't loaded, dynamically include
			* it again, and continue waiting another 30 seconds... that might work..
		*/ ?>
		window.FashioncraftDesigner.Settings.ItemNumber = "<?php echo $itemNumber; ?>";
		window.FashioncraftDesigner.Settings.itemNumberNumeric = "<?php echo $itemNumberNumeric; ?>";
		window.FashioncraftDesigner.Settings.DesignID = "<?php echo $DesignID; ?>";
		window.FashioncraftDesigner.Settings.LocalDesignID = "<?php echo $LocalDesignID; ?>";
		window.FashioncraftDesigner.Settings.DisableInteraction = <?php echo $DisableInteraction; ?>;

      <?php if ( isset( $_REQUEST["quantity"] ) && is_numeric( $_REQUEST["quantity"] ) ) { ?>
         window.FashioncraftDesigner.Settings.DefaultQuantity = "<?php echo htmlentities( $GLOBALS["defaultQuantity"] ); ?>";
      <?php } ?>
      <?php if ( isset( $designType["labelType"] ) ) { ?>
         window.FashioncraftDesigner.Settings.CalculatedLabelType = "<?php echo $designType["labelType"]; ?>";
      <?php } ?>
      <?php if ( isset( $designType["labelShape"] ) ) { ?>
         window.FashioncraftDesigner.Settings.CalculatedLabelShape = "<?php echo $designType["labelShape"]; ?>";
      <?php } ?>

      window.FashioncraftDesigner.Settings.LabelType = "<?php echo $labelType; ?>";
		window.FashioncraftDesigner.Settings.AddOns = <?php echo $addOnsJSON; ?>;
		window.FashioncraftDesigner.Settings.DefaultTab = "<?php echo $defaultTab; ?>";
		<?php
			if ( isset( $_REQUEST["BoxCharge"] ) && is_numeric( $_REQUEST["BoxCharge"] ) ) {
				?>
					if ( typeof( window.FashioncraftDesigner.Settings.AddOns.boxes ) == "undefined" ) {
						window.FashioncraftDesigner.Settings.AddOns.boxes = {};
					}
					window.FashioncraftDesigner.Settings.AddOns.boxes.DefaultBoxCharge = "$<?php echo htmlentities( $_REQUEST["BoxCharge"] ); ?>";
					window.FashioncraftDesigner.Settings.AddOns.boxes.RetailBoxCharge = "$<?php echo htmlentities( $_REQUEST["BoxCharge"] ); ?>";
				<?php
			}
			if ( isset( $_REQUEST["CraftBoxCharge"] ) && is_numeric( $_REQUEST["CraftBoxCharge"] ) ) {
				?>
					if ( typeof( window.FashioncraftDesigner.Settings.AddOns.boxes ) == "undefined" ) {
						window.FashioncraftDesigner.Settings.AddOns.boxes = {};
					}
					window.FashioncraftDesigner.Settings.AddOns.boxes.DefaultCraftBoxCharge = "$<?php echo htmlentities( $_REQUEST["CraftBoxCharge"] ); ?>";
					window.FashioncraftDesigner.Settings.AddOns.boxes.RetailCraftBoxCharge = "$<?php echo htmlentities( $_REQUEST["CraftBoxCharge"] ); ?>";
				<?php
			}
		?>

		<?php
			if ( $jsPHP ) {
				include("<?php echo $jsPHP; ?>");
			}
		?>

		<?php if ( isset( $designDataJSON ) ) { ?>
			window.FashioncraftDesigner.Settings.ExistingDesign = <?php echo $designDataJSON; ?>;
		<?php } ?>
   </script>
	<?php
		if ( $js ) {
			?><script type="text/javascript" src="<?php echo $js; ?>"></script><?php
		}
	?>
</head>
<body>
	<script>
		(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
		ga('create', 'UA-432051-1', 'auto');
		ga('send', 'pageview');
	</script>

	<div id="mainContainer" class="ui-widget ui-corner-all<?php if ( $DisableInteraction == "true" ) { ?> DisableInteraction<?php } ?>">

		<?php /* TOP NAVIGATION */ ?>
		<div class="header ui-widget-header ui-corner-all">
			<?php if ( isset($_REQUEST["PhotoUpload"]) ) { ?>
				<div class="labelTypeSwitch">
					<a href="javascript:void(0);" class="ChangeLabelType ChangeLabelType-DYO ui-button"><img src="/Designer/images/misc/palette.png" alt="DYO" height="35"></a>
					<a href="javascript:void(0);" class="ChangeLabelType ChangeLabelType-Photo ui-button"><img src="/Designer/images/misc/photograph.png" alt="Upload" height="35"></a>
					<span class="switch-btn ui-widget ui-state-default switch-left"></span>
				</div>
			<?php } ?>
			<div class="navigation<?php if ( isset($_REQUEST["PhotoUpload"]) ) { ?> PhotoEnabledLabel<?php } ?>">
				<?php include( $navFile ); ?>
			</div>
			<!--<?php //if ( isset($_REQUEST["PhotoUpload"]) ) { ?>
				<a href="javascript:void(0);" class="ChangeLabelType ChangeLabelType-DYO ui-button ui-widget ui-state-default"><img src="/Designer/images/misc/palette.png" alt="DYO" height="35"></a>
				<a href="javascript:void(0);" class="ChangeLabelType ChangeLabelType-Photo ui-button ui-widget ui-state-default"><img src="/Designer/images/misc/photograph.png" alt="Upload" height="35"></a>
			<?php //} ?> -->

			<?php if ( isset( $_REQUEST["id"] ) ) { ?>
				<div id="headerCompleteDesign">
					<?php if ( !isset( $_REQUEST["hideQuantity"] ) || $_REQUEST["hideQuantity"] != "true" ) { ?>
						<?php printQuantityField(); ?>
					<?php } ?>
					<button class="submitDesign"><?php echo $SubmitDesignText; ?></button>
				</div>
			<?php } ?>

			<div class="history">
            <span class="historyBack ui-state-default ui-corner-all" title="Undo / Go Back"><i class="fa fa-undo" aria-hidden="true"></i></span>
	         <span class="historyForward disabled ui-state-default ui-corner-all" title="Redo / Go Forward"><i class="fa fa-repeat" aria-hidden="true"></i></span>
        </div>
		  <?php if ( !isset( $_REQUEST["id"] ) ) { ?>
			  <div class="chosenOptionsContainer">
				  <p class="showChosenOptions ui-state-default ui-corner-all">My Choices <i class="fa fa-hand-pointer-o" aria-hidden="true"></i></p>
				  <ul class="chosenOptions ui-state-default ui-corner-all"></ul>
			  </div>
		  <?php } ?>
		  <br class="clear">
		  <?php if ( !isset( $_REQUEST["id"] ) ) { ?>
			  <p class="standardInstructions">When you're ready, just fill in all your <span class="showChosenOptions" style="text-decoration: underline;">choices</span> in the menus provided on the product page.</p>
		  <?php } ?>
		</div>

		<?php /* SIDE PANELS */ ?>
		<div id="optionPanels" class="ui-corner-all">
			<?php include( $sidePanels ); ?>
		</div>

		<?php /* CANVAS */ ?>
		<div id="canvasContainer" class="ui-corner-all" data-labelType="<?php echo $designType["labelType"]; ?>" data-labelShape="<?php echo $designType["labelShape"]; ?>" data-itemNumber="<?php echo $itemNumber; ?>" data-itemNumberNumeric="<?php echo $itemNumberNumeric; ?>">
			<?php include( $canvas ); ?>
			<div id="nextPrevious">
				<div class="previous"><span class="text">Previous</span><i class="fa fa-arrow-left" aria-hidden="true"></i></div>
				<div class="next"><span class="text">Next</span><i class="fa fa-arrow-right" aria-hidden="true"></i></div>
				<br class="clear">
			</div>
			<div id="canvasCompleteDesign">
				<?php if ( !isset( $_REQUEST["hideQuantity"] ) || $_REQUEST["hideQuantity"] != "true" ) { ?>
					<?php printQuantityField(); ?>
				<?php } ?>
				<button class="submitDesign"><?php echo $SubmitDesignText; ?></button>
			</div>
		</div>
	</div>

	<p class="loadingAnimation">
		<img src="/fashioncraftDesignStudio/studio/image/loadingAnimation.gif" height="13" width="208" alt="Loading...">
		<br>Loading...
	</p>
	<div id="infoBox"></div>
	<div id="confirmBox"></div>

	<?php
		if ( isset( $additionalJS ) ) {
			foreach( $additionalJS as $js ) {
				?><script type="text/javascript" src="<?php echo $js; ?>"></script><?php
			}
		}
	?>

	<?php
		$inspectletAdded = false;
		$fullStoryAdded = false;

		switch( $referringDomain ) {
		case "www.favorfavor.com":
		case "www.nicepricefavors.com":
		  $inspectletAdded = true;
		  $fullStoryAdded = true;
		  ?>
			  <script type="text/javascript">
				  <?php if ( true ) { ?>
					  /* fullStory */
					  window['_fs_run_in_iframe'] = true;
					  window['_fs_debug'] = false;
					  window['_fs_host'] = 'www.fullstory.com';
					  window['_fs_org'] = '1DW6T';
					  window['_fs_namespace'] = 'FS';
					  (function(m,n,e,t,l,o,g,y){
						 if (e in m && m.console && m.console.log) { m.console.log('FullStory namespace conflict. Please set window["_fs_namespace"].'); return;}
						 g=m[e]=function(a,b){g.q?g.q.push([a,b]):g._api(a,b);};g.q=[];
						 o=n.createElement(t);o.async=1;o.src='https://'+_fs_host+'/s/fs.js';
						 y=n.getElementsByTagName(t)[0];y.parentNode.insertBefore(o,y);
						 g.identify=function(i,v){g(l,{uid:i});if(v)g(l,v)};g.setUserVars=function(v){g(l,v)};
						 g.identifyAccount=function(i,v){o='account';v=v||{};v.acctId=i;g(o,v)};
						 g.clearUserCookie=function(d,i){d=n.domain;while(1){n.cookie='fs_uid=;domain='+d+
						 ';path=/;expires='+new Date(0);i=d.indexOf('.');if(i<0)break;d=d.slice(i+1)}}
					  })(window,document,window['_fs_namespace'],'script','user');
				  <?php } ?>

				  <?php if ( $referringDomain == "www.nicepricefavors.com" && $_REQUEST["labelType"] == "6704ST" ) { ?>
					  /* inspectlet */
					  var inspectletID;
					  inspectletID = 1977278330; // main (original) account
					  inspectletID = 1852964398; // created 2017-02-02 for testing purposes because recordings were full on the main account
					  window.__insp = window.__insp || [];
					  __insp.push(['wid', inspectletID]);
					  (function() {
					  function ldinsp(){if(typeof window.__inspld != "undefined") return; window.__inspld = 1; var insp = document.createElement('script'); insp.type = 'text/javascript'; insp.async = true; insp.id = "inspsync"; insp.src = ('https:' == document.location.protocol ? 'https' : 'http') + '://cdn.inspectlet.com/inspectlet.js'; var x = document.getElementsByTagName('script')[0]; x.parentNode.insertBefore(insp, x); };
					  setTimeout(ldinsp, 500); document.readyState != "complete" ? (window.attachEvent ? window.attachEvent('onload', ldinsp) : window.addEventListener('load', ldinsp, false)) : ldinsp();
					  })();
				  <?php } ?>
			  </script>
			 <?php
		  break;
		}
	?>

	<?php if ( !$inspectletAdded ) { ?>
	  <?php /*?><!-- Begin Fashioncraft Inspectlet Embed Code --><?php */?>
			  <script type="text/javascript" id="inspectletjs">
					window.__insp = window.__insp || [];
					__insp.push(['wid', 1637590173]);
					(function() {
					function ldinsp(){if(typeof window.__inspld != "undefined") return; window.__inspld = 1; var insp = document.createElement('script'); insp.type = 'text/javascript'; insp.async = true; insp.id = "inspsync"; insp.src = ('https:' == document.location.protocol ? 'https' : 'http') + '://cdn.inspectlet.com/inspectlet.js'; var x = document.getElementsByTagName('script')[0]; x.parentNode.insertBefore(insp, x); };
					setTimeout(ldinsp, 500); document.readyState != "complete" ? (window.attachEvent ? window.attachEvent('onload', ldinsp) : window.addEventListener('load', ldinsp, false)) : ldinsp();
					})();
			  </script>
		 <?php /*?><!-- End Inspectlet Embed Code --><?php */?>
	<?php } ?>

	<script>
		(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
			(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
			m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

		ga('create', 'UA-432051-1', 'auto');
		ga('send', 'pageview');
	</script>

	<?php if ( isset($_REQUEST["PhotoUpload"]) ) { ?>
		<?php // display popup window for photo labels: ?>
		<div id="new-feature">
			<div class="feature-text">
				<h3 class="ui-widget">Upload your own photo!</h3>
				<p>You can now add a custom photo to your label</p>
			</div>
			<div class="feature-btns">
				<a href="#" class="cta-photo ui-button ui-widget ui-widget-header">Show me</a>
				<a href="#" class="dismiss-photo ui-button ui-widget ui-state-default" style="margin-left:10px;">Dismiss</a>
			</div>
		</div>
	<?php } ?>
</body>
</html>
