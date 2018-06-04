<?php
include_once( "../../ps/functions.php" );
$database = dbConnect( "pdo" );
include( "include/session.php" );
if ( isLoggedIn( "admin", $database, "pdo" ) || isLoggedInAlt( "miva", "admin" ) ) { ?><?php if ( !count( $_POST ) ) { ?><!DOCTYPE html>
   <html>
   <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <title>Item Stock And Usage</title>
      <style type="text/css">
         #sampleData {
            width: 200px;
         }
         #sampleData, #sampleData td, #sampleKey, #sampleKey td {
            border: 1px solid #ddd;
         }
         .blockLabel {
            display: inline-block;
            float: left;
            width: 30%;
            border-left: 1px solid #000;
            padding-left: 6px;
         }
         .blockLabel:first-child {
            border-left: none;
            padding-left: 2px;
         }
         .datepicker {
            width: 90px;
         }
         .DateRange {
            border: 1px solid #00f;
            display: inline-block;
            padding: 5px;
            margin: 5px;
         }
         #loadingAnimation { display: none; }
      </style>

      <?php include( "include/headTag/jQuery.php" ); ?>
      <?php include( "include/headTag/general.php" ); ?>
      <?php $DataTablesCopyVersion = "html5"; ?>
      <?php include( "include/headTag/datatables.php" ); ?>

      <script type="text/javascript" src="/include/js/plugins/jquery.form.min.js"></script>

      <script type="text/javascript">
         function DTableInit() {
            window.dTable = jQuery("#results table").DataTable({
               "footerCallback": function( row, data, start, end, display ) {
                  var api = this.api(), data;

                  // Remove the formatting to get integer data for summation
                  var intVal = function ( i ) {
                     return typeof i === 'string' ? i.replace(/[\$,]/g, '') * 1 : typeof i === 'number' ? i : 0;
                  };
                  var numberWithCommas = function(x) {
                     return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                  };

                  // Total over this page (we don't paginate, so this page is everything)
                  pageTotal1 = api.column( 1, { page: 'current'} ).data().reduce( function (a, b) {
                     return intVal(a) + intVal(b);
                  }, 0 );
                  jQuery( api.column( 1 ).footer() ).html( numberWithCommas(pageTotal1) );

                  pageTotal2 = api.column( 2, { page: 'current'} ).data().reduce( function (a, b) {
                     return intVal(a) + intVal(b);
                  }, 0 );
                  jQuery( api.column( 2 ).footer() ).html( numberWithCommas(pageTotal2) );

                  if ( api.row(0).data().length == 4 ) {
                     pageTotal3 = api.column( 3, { page: 'current'} ).data().reduce( function (a, b) {
                        return intVal(a) + intVal(b);
                     }, 0 );
                     jQuery( api.column( 3 ).footer() ).html( numberWithCommas(pageTotal3) );
                  }

               },
               "paging": false,
               "dom": "fBit",
               buttons: [
                  'copyHtml5',
                  'selectAll',
                  'selectNone'
               ],
               select: true,
               language: {
                  buttons: {
                     copy: "Copy all",
                     selectAll: "Select all",
                     selectNone: "Select none"
                  }
               }
            });
         }
         jQuery(document).ready(function(){

            jQuery(".datepicker").datepicker({"dateFormat": "m/d/yy"});

            jQuery(document).on("change","select[name='DateRangeSelect']",function(){
               switch( jQuery(this).val() ) {
               case "1212":
                  var Today = new Date();

                  var Yesterday = new Date(Today);
                  Yesterday.setDate(Today.getDate() - 1);
                  //console.log(Yesterday);
                  jQuery("input[name='endDateB']").val( Yesterday.getMonth() + 1 + "/" + Yesterday.getDate() + "/" + Yesterday.getFullYear() );

                  var OneYearAgo = new Date(Today);
                  OneYearAgo.setFullYear(Today.getFullYear() - 1);
                  //console.log(OneYearAgo);
                  jQuery("input[name='startDateB']").val( OneYearAgo.getMonth() + 1 + "/" + OneYearAgo.getDate() + "/" + OneYearAgo.getFullYear() );

                  var OneYearOneDayAgo = new Date(Yesterday);
                  OneYearOneDayAgo.setFullYear(Yesterday.getFullYear() - 1);
                  //console.log(OneYearOneDayAgo);
                  jQuery("input[name='endDateA']").val( OneYearOneDayAgo.getMonth() + 1 + "/" + OneYearOneDayAgo.getDate() + "/" + OneYearOneDayAgo.getFullYear() );

                  var TwoYearsAgo = new Date(Today);
                  TwoYearsAgo.setFullYear(Today.getFullYear() - 2);
                  //console.log(TwoYearsAgo);
                  jQuery("input[name='startDateA']").val( TwoYearsAgo.getMonth() + 1 + "/" + TwoYearsAgo.getDate() + "/" + TwoYearsAgo.getFullYear() );

                  break;
               }
            });

            var ajaxFormOptions = {
					beforeSubmit: function(){
						jQuery("body").css("overflow","hidden");
						jQuery("#loadingAnimation").show().animate({
							opacity: 1
						}, 400 );
					},
					success: function(responseText, statusText, xhr, $form){
						jQuery("#loadingAnimation").animate({
							opacity: 0
						}, 400, function(){
							jQuery("#loadingAnimation").hide();
							jQuery("body").css("overflow","scroll");
							jQuery("#results").html(responseText);
                     DTableInit();
						});
					}
				};

				jQuery("#NavItemStockAndUsage").ajaxForm( ajaxFormOptions );

         });
      </script>
   </head>

   <body style="margin: 5px;">
      <?php
         if ( $navigationVersion == "1" ) {
            ?>
               <div id="leftNavAdmin">
                  <?php include("include/nav/v1.php"); ?>
               </div>
            <?php
         } else {
            ?>
               <div id="leftNavAdminv2">
                  <?php include("include/nav/v2.php"); ?>
               </div>
            <?php
         }
      ?>
      <div id="mainContentAdmin">
         <h1>Item Stock and Usage Data</h1>
         <p>
         </p>
         <hr>
         <form action="/mm5/ps/NavItemStockAndUsage.php" method="post" enctype="multipart/form-data" name="NavItemStockAndUsage" id="NavItemStockAndUsage">
            <table>
               <tr>
                  <td><label for="itemNumber">Item Number:</label></td>
                  <td>
                     <input class="itemNumber" type="text" name="itemNumber" id="itemNumber"<? if ( $_POST["itemNumber"] ) { ?> value="<? echo $_POST["itemNumber"]; ?>"<? } ?>>
                  (optional, all are returned if this is blank)
                  </td>
               </tr>
               <tr>
                  <td><label for="DateRangeSelect">Date Range Presets:</label></td>
                  <td>
                     <select name="DateRangeSelect" id="DateRangeSelect">
                        <option value="">Choose</option>
                        <option value="1212">Prior 12 + Last 12</option>
                     </select>
                  </td>
               </tr>
               <tr>
                  <td colspan="2">
                     <p style="margin-left: 50px;">
                        <span class="DateRange">
                           <label>
                              From (A):
                              <input class="datepicker" type="text" name="startDateA" id="startDateA">
                           </label>
                           <label>
                              To (A):
                              <input class="datepicker" type="text" name="endDateA" id="endDateA">
                           </label>
                        </span>

                        <span class="DateRange">
                           <label>
                              From (B):
                              <input class="datepicker" type="text" name="startDateB" id="startDateB">
                           </label>
                           <label>
                              To (B):
                              <input class="datepicker" type="text" name="endDateB" id="endDateB">
                           </label>
                        </span>
                     </p>
                  </td>
               </tr>
            </table>
            <p>
               <br style="clear: both;">
               <br>
               <input type="submit" name="NavItemStockAndUsageSubmit" id="NavItemStockAndUsageSubmit" value="Submit">
            </p>
            <p id="loadingAnimation">
   				<img src="/images/loadingAnimation.gif" height="13" width="208" alt="Loading...">
   			</p>
         </form>
         <hr>
         <div id="results"></div>
      </div>
   </body>
   </html><?php } else { ?>
      <?php
         $ItemList = false;
         //echo "post detected";
         //echo "<pre>"; var_dump( $_POST ); echo "</pre>";
         if ( true ) {
            $ItemNumber = isset( $_POST["itemNumber"] ) && $_POST["itemNumber"] != "" ? $_POST["itemNumber"] : false;

            if ( isset( $_POST["startDateA"] ) && $_POST["startDateA"] != "" && isset( $_POST["endDateA"] ) && $_POST["endDateA"] != "" ) {
               $RangeA = GetNavisionSalesInvoiceLineTotals( $_POST["startDateA"] . ".." . $_POST["endDateA"], $ItemNumber );

               foreach( $RangeA as $Item ) {
                  $ItemList[$Item["ItemNumber"]]["RangeA"] = $Item["Quantity"];
               }
            }
            if ( isset( $_POST["startDateB"] ) && $_POST["startDateB"] != "" && isset( $_POST["endDateB"] ) && $_POST["endDateB"] != "" ) {
               $RangeB = GetNavisionSalesInvoiceLineTotals( $_POST["startDateB"] . ".." . $_POST["endDateB"], $ItemNumber );
               foreach( $RangeB as $Item ) {
                  $ItemList[$Item["ItemNumber"]]["RangeB"] = $Item["Quantity"];
               }
            } else {
               $RangeB = false;
            }

            /* now let's get stock data. We could get this from our custom fields, but
            * matching it up exactly with Nav's item numbers requires a decent amount of code. If we just
            * get it from Nav directly, it takes about 4 seconds longer. Not the end of the world.
            */
            $Quantities = Nav_GetItemQuantities();
         }


         ?>
            <?php if ( $ItemList ) { ?>
               <table class="display compact">
                  <thead>
                     <tr>
                        <th>Item Number</th>
                        <th>To Sell</th>
                        <th>Quantity Ordered<br>(<?php echo $_POST["startDateA"]; ?> - <?php echo $_POST["endDateA"]; ?>)</th>
                        <?php if ( $RangeB ) { ?>
                           <th>Quantity Ordered<br>(<?php echo $_POST["startDateB"]; ?> - <?php echo $_POST["endDateB"]; ?>)</th>
                        <?php } ?>
                     </tr>
                  </thead>
                  <tfoot>
                     <tr>
                        <th>Totals:</th>
                        <th></th>
                        <th></th>
                        <?php if ( $RangeB ) { ?>
                           <th></th>
                        <?php } ?>
                     </tr>
                  </tfoot>
                  <tbody>
                     <?php foreach( $ItemList as $ItemNumber=>$ItemData ) { ?>
                        <?php if ( trim($ItemNumber) != "" ) { ?>
                           <?php
                              if ( isset( $Quantities[$ItemNumber] ) ) {
                                 $ToSell = $Quantities[$ItemNumber]["QuantityOnHand"] - $Quantities[$ItemNumber]["QuantityOnSalesOrder"] + $Quantities[$ItemNumber]["QuantityOnPurchaseOrder"];
                              } else {
                                 $ToSell = "";
                              }
                           ?>
                           <tr>
                              <td><?php echo $ItemNumber; ?></td>
                              <td><?php echo number_format($ToSell, 0); ?></td>
                              <td><?php echo number_format($ItemData["RangeA"], 0); ?></td>
                              <?php if ( $RangeB ) { ?>
                                 <td><?php echo number_format($ItemData["RangeB"], 0); ?></td>
                              <?php } ?>
                           </tr>
                        <?php } ?>
                     <?php } ?>
                  </tbody>
               </table>
            <?php } ?>
         <?php

      ?>
   <?php } ?>
<?php } else {
   include("altLogin/login.php");
}
?>