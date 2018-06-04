/**********************************************************

AddStroke.js

DESCRIPTION

adds a stroke to all fonts of type english 111 vivace bt

**********************************************************/

//alert("working");

var numberOfWords = 0;

if ( documents.length > 0 ) {
	// change  text lines
	//alert("checking text");
	if ( !isBarCodeLabel( activeDocument ) ) {
		//changeText( activeDocument, "Emanuel & Michelle", "8.17.17", "", "EM" );

		// show/hide layers
		// text first
		//alert("hiding text");
		//hideTextAndHeadline( activeDocument );
		//alert("showing text");
		//showTextAndHeadline( activeDocument, "Script", "Midnight" );

		// show design
		//alert("showing design");
		showDesign( activeDocument, "Key", "Midnight" );

		var DesignLayer = FindDesignLayer( activeDocument, "Key" );
		//alert(DesignLayer.name);
		changeMonogram( activeDocument, "EM", DesignLayer );

	} else {
		setBarcodeLabel( activeDocument, "*SO1476452*", "*6713STX*" );
	}
} else {
	alert("Open a document with text items.");
}

function isBarCodeLabel( activeDocument ) {
	var activeLayer;
	var result = false;
	for ( var i = 0; i < activeDocument.layers.length; i++ ) {
		if ( activeDocument.layers[i].name.toLowerCase().substr(0,8) == "barcodes" ) {
			result = true;
		}
	}
	return result;
}

function GetNextBarCodeLayer( activeDocument ) {
	var activeLayer;
	var result = false;
	for ( var i = 0; i < activeDocument.layers.length; i++ ) {
		if ( activeDocument.layers[i].name.toLowerCase().substr(0,8) == "barcodes" && activeDocument.layers[i].name.toLowerCase().indexOf("Processed") == -1 ) {
			var textFields = activeDocument.layers[i].textFrames;
			if ( !result && textFields.length > 1) {
				for ( var j = 0 ; j < textFields.length; j++ ) {
					if ( textFields[j].name.toLowerCase() == "sonumber" && textFields[j].contents.toLowerCase() == "so number" ) {
						result = i;
					}
				}
			} else {
				//alert("Could not locate bar code layer");
			}
		}
	}
	return result;
}

function setBarcodeLabel( activeDocument, soNumber, itemNumber ) {
	var BarCodeLayer = GetNextBarCodeLayer( activeDocument );
	//alert("BarCodeLayer = '" + BarCodeLayer + "'");
	BarCodeLayer = activeDocument.layers[BarCodeLayer];
	BarCodeLayer.name = BarCodeLayer.name + "_Processed";
	var textFields = BarCodeLayer.textFrames;
	if ( textFields.length > 1) {
		for ( var i = 0 ; i < textFields.length; i++ ) {
			if ( textFields[i].name.toLowerCase() == "barcodesonumber" || textFields[i].name.toLowerCase() == "sonumber" ) {
				textFields[i].contents = soNumber;
			} else if ( textFields[i].name.toLowerCase() == "barcodeitemnumber" || textFields[i].name.toLowerCase() == "itemnumber") {
				textFields[i].contents = itemNumber;
			}
		}
	} else {
		alert("Open a document with text items.");
	}
}

function hideTextAndHeadline( activeDocument ) {
	var activeLayer;
	for ( var i = 0; i < activeDocument.layers.length; i++ ) {
		if ( activeDocument.layers[i].name.toLowerCase() == "personalization" || activeDocument.layers[i].name.toLowerCase().substr(0,15) == "personalization" ) {
			activeLayer = activeDocument.layers[i];
			//alert("active layer = '" + activeLayer.name + "'");
			for ( var j = 0; j < activeLayer.layers.length; j++ ) {
				/* there should always be a "text" layer here
				* and possibly a "headline" layer and a "monogram" layer
				* descend into each and unhide the correct layer(s)
				*/
				for( var k = 0; k < activeLayer.layers[j].layers.length; k++ ) {
					for( var m = 0; m < activeLayer.layers[j].layers[k].layers.length; m++ ) {
						activeLayer.layers[j].layers[k].layers[m].visible = false;
					}
				}
			}
		}
	}
}

function showTextAndHeadline( activeDocument, chosenFont, backgroundColor ) {
	var activeLayer;
	var targetColor;

	targetColor = "black"; // for testing

	for ( var i = 0; i < activeDocument.layers.length; i++ ) {
		if ( activeDocument.layers[i].name.toLowerCase() == "personalization" || activeDocument.layers[i].name.toLowerCase().substr(0,15) == "personalization" ) {
			activeLayer = activeDocument.layers[i];
			//alert("active layer = '" + activeLayer.name + "'");
			for ( var j = 0; j < activeLayer.layers.length; j++ ) {
				if ( activeLayer.layers[j].name.toLowerCase() == chosenFont.toLowerCase() ) {
					//alert("showing text for '" + activeLayer.layers[j].name + "'");
					activeLayer = activeLayer.layers[j];
					/* there should always be a "text" layer here
					* and possibly a "headline" layer and a "monogram" layer
					* descend into each and unhide the correct layer(s)
					*/
					for( var k = 0; k < activeLayer.layers.length; k++ ) {
						//alert(activeLayer.layers[k].name);
						if ( true ) {
							for( var m = 0; m < activeLayer.layers[k].layers.length; m++ ) {
								if ( activeLayer.layers[k].layers[m].name.toLowerCase() == targetColor.toLowerCase() ) {
									activeLayer.layers[k].layers[m].visible = true;
								} else {
									activeLayer.layers[k].layers[m].visible = false;
								}
							}
						}
					}
				}
			}
		}
	}
}

function changeMonogram( activeDocument, newMonogram, Parent ) {
	var textFields = Parent.textFrames;

	if ( textFields.length > 1 ) {
		var characterSelection;
		for ( var i = 0 ; i < textFields.length; i++ ) {
			if ( cleanText(textFields[i].name.toLowerCase()) == "monogramtext" ) {
				for( var j = 0; j < textFields[i].characters.length; j++ ) {
					if ( typeof( newMonogram[j] ) != "undefined" ) {
						characterSelection = textFields[i].characters[j];
						characterSelection.length = 1;
						characterSelection.contents = newMonogram[j];
					}
				}
			}
		}
	} else {
		alert("Open a document with text items.");
	}
}

function changeText( activeDocument, headline, line1, line2, monogramLetter ) {
	var textFields = activeDocument.textFrames;

	var originalFontName;
	var newFontName;
	var changeCount = 0;
	var textContentsChanged;

	if ( headline == "" ) { headline = " "; }
	if ( line1 == "" ) { line1 = " "; }
	if ( line2 == "" ) { line2 = " "; }
	if ( monogramLetter == "" ) { monogramLetter = " "; }

	if ( textFields.length > 1 ) {
		for ( var i = 0 ; i < textFields.length; i++ ) {
			if ( textFields[i].name.toLowerCase() == "headline" || textFields[i].contents.toLowerCase() == "headline" ) {
				/* there's a bug in illustrator, particularly on the luggage tags template
				* where, even though the text field is correctly named "headline", it gets
				* reported to javascript as blank
				* so the case above where we check the name will never work
				* so, this works as a fallback. If the contents are "headline" we can be
				* reasonably certain that this is a headline
				*/
				originalFontName = textFields[i].textRange.characterAttributes.textFont.name;
				textContentsChanged = true;
				textFields[i].contents = headline;
				if ( originalFontName != textFields[i].textRange.characterAttributes.textFont.name ) { changeCount++; }
			} else if ( textFields[i].name.toLowerCase() == "textline1" ) {
				originalFontName = textFields[i].textRange.characterAttributes.textFont.name;
				textContentsChanged = true;
				textFields[i].contents = line1;
				if ( originalFontName != textFields[i].textRange.characterAttributes.textFont.name ) { changeCount++; }
			} else if ( textFields[i].name.toLowerCase() == "textline2" ) {
				originalFontName = textFields[i].textRange.characterAttributes.textFont.name;
				textContentsChanged = true;
				textFields[i].contents = line2;
				if ( originalFontName != textFields[i].textRange.characterAttributes.textFont.name ) { changeCount++; }
			} else if ( monogramLetter != "" && textFields[i].name.toLowerCase() == "monogramletter" ) {
				originalFontName = textFields[i].textRange.characterAttributes.textFont.name;
				textContentsChanged = true;
				textFields[i].contents = monogramLetter.toUpperCase(); // it should already be uppercase, but whatever
				if ( originalFontName != textFields[i].textRange.characterAttributes.textFont.name ) { changeCount++; }
			}
		}
		if ( changeCount ) {
			alert(
				"IMPORTANT!\nYou MUST revert this file after you print the order (press F12 on your keyboard). Do this AFTER you print the order!" +
				"\nA font has been changed. If you do not revert the file, any order you print after this may be WRONG." +
				"\n\nThis order may ALSO have issues, look at it very closely!!" +

				"\n\nDOUBLE CHECK THIS ORDER!" +
				"\nDOUBLE CHECK THIS ORDER!" +
				"\nDOUBLE CHECK THIS ORDER!" +

				"\n\nHIT F12 AFTER YOU PRINT THE ORDER!" +
				"\nHIT F12 AFTER YOU PRINT THE ORDER!" +
				"\nHIT F12 AFTER YOU PRINT THE ORDER!" +

				"\n\nDOUBLE CHECK THIS ORDER!" +
				"\nHIT F12 AFTER YOU PRINT THE ORDER!" +
				"\nDOUBLE CHECK THIS ORDER!" +
				"\nHIT F12 AFTER YOU PRINT THE ORDER!" +
				"\nDOUBLE CHECK THIS ORDER!" +
				"\nHIT F12 AFTER YOU PRINT THE ORDER!" +
				"\nDOUBLE CHECK THIS ORDER!" +
				"\nHIT F12 AFTER YOU PRINT THE ORDER!" +
				"\nDOUBLE CHECK THIS ORDER!"
			);
		}
	} else {
		alert("Open a document with text items.");
	}
}

function FindDesignLayer( Parent, chosenDesign ) {
	var result = false;
	for ( var i = 0; i < Parent.layers.length; i++ ) {
		if ( Parent.layers[i].name.toLowerCase() == "designs" || Parent.layers[i].name.toLowerCase() == "design" || Parent.layers[i].name.toLowerCase() == "art" ) {
			/* 2017-08: this is unlikely because the designs in the monogram template aren't stored in a sublayer.
			* But just in case, we'll need to loop through them..
			*/
			FindDesignLayer( Parent.layers[i], chosenDesign );
		} else {
			if ( !result && cleanText(Parent.layers[i].name) == cleanText(chosenDesign) ) {
				result = Parent.layers[i];
			}
		}
	}
	return result;
}

function showDesign( activeDocument, chosenDesign, chosenBackgroundColor ) {
	// it's a normal design
	var activeLayer;
	var designFound = false;
	var colorFound = false;

	for ( var i = 0; i < activeDocument.layers.length; i++ ) {

		if ( !designFound && cleanText(activeDocument.layers[i].name) == cleanText(chosenDesign) ) {
			activeDocument.layers[i].visible = true;
			designFound = true;

			// now loop through the child colors and show the appropriate one, hiding the rest
			activeLayer = activeDocument.layers[i];
			for ( var j = 0; j < activeLayer.layers.length; j++ ) {
				if ( !colorFound && cleanText(activeLayer.layers[j].name) == cleanText(chosenBackgroundColor) ) {
					activeLayer.layers[j].visible = true;
					colorFound = true;
				} else {
					activeLayer.layers[j].visible = false;
				}
			}
		} else {
			activeDocument.layers[i].visible = false;
		}
	}
}

function cleanText( text ) {
	return text.replace( / /g, "" ).replace( /-/g, "" ).replace( /_/g, "" ).replace( /\./g, "" ).replace( /\(/g, "" ).replace( /.)/g, "" ).toLowerCase();
}

function showColors( activeDocument, backgroundColor, borderColor ) {
	var activeLayer;
	for ( var i = 0; i < activeDocument.layers.length; i++ ) {
		if ( activeDocument.layers[i].name.toLowerCase() == "colors" || activeDocument.layers[i].name.toLowerCase() == "color" || activeDocument.layers[i].name.toLowerCase().substr(0,5) == "color" ) {
			activeLayer = activeDocument.layers[i];
			for ( var j = 0; j < activeLayer.layers.length; j++ ) {
				//alert("checking '" + activeLayer.layers[j].name + "'");
				if ( activeLayer.layers[j].name.toLowerCase() == "background color" ) {
					showBackgroundColor( activeLayer.layers[j], backgroundColor );
				} else if ( activeLayer.layers[j].name.toLowerCase() == "border color" ) {
					showBorderColor( activeLayer.layers[j], borderColor );
				}
			}
		}
	}
}

function showBackgroundColor( activeLayer, backgroundColor ) {
	// first check sub layers
	for( var i = 0; i < activeLayer.layers.length; i++ ) {
		if ( cleanText(activeLayer.layers[i].name) == cleanText(backgroundColor) ) {
			activeLayer.layers[i].visible = true;
		} else {
			activeLayer.layers[i].visible = false;
		}
	}

	// now check sub paths
	for( var i = 0; i < activeLayer.pathItems.length; i++ ) {
		//alert("activeLayer.pathItems.length = '" + activeLayer.pathItems.length + "', current name = '" + activeLayer.pathItems[i].name.toLowerCase() + "'");
		if ( cleanText(activeLayer.pathItems[i].name) == cleanText(backgroundColor) ) {
			//alert("found correct color: '" + borderColor.toLowerCase() + "'");
			activeLayer.pathItems[i].hidden = false;
		} else {
			activeLayer.pathItems[i].hidden = true;
		}
	}

	// now check sub groups
	for( var i = 0; i < activeLayer.groupItems.length; i++ ) {
		//alert("activeLayer.pathItems.length = '" + activeLayer.pathItems.length + "', current name = '" + activeLayer.pathItems[i].name.toLowerCase() + "'");
		if ( cleanText(activeLayer.groupItems[i].name) == cleanText(backgroundColor) ) {
			//alert("found correct color: '" + borderColor.toLowerCase() + "'");
			activeLayer.groupItems[i].hidden = false;
		} else {
			activeLayer.groupItems[i].hidden = true;
		}
	}
}









