<?php
include_once( "../../ps/functions.php" );
dbConnect();
$database = dbConnect( "pdo" );
include( "include/session.php" );
if ( isLoggedIn( "admin", $database, "pdo" ) || isLoggedInAlt( "any", "admin" ) ) {

	function ManageItemUsageGroups_PrintGroups( $database ) {
		$Groups = $database->prepare("SELECT * FROM ItemUsageGroups");
		if ( $Groups->execute() ) {
			//$Groups = $Groups->fetchAll(PDO::FETCH_ASSOC);
			//echo "<pre>"; var_dump( $Groups ); echo "</pre>";

			?>

				<table id="ItemGroups" class="display compact">
					<thead>
						<tr>
							<td>Parent Item</td>
							<td>Child Items</td>
							<td>Manage</td>
						</tr>
					</thead>
					<tbody>
						<?php while( $Group = $Groups->fetch(PDO::FETCH_ASSOC) ) { ?>
							<tr data-ParentItem="<?php echo $Group["ParentItem"]; ?>">
								<td><strong><?php echo $Group["ParentItem"]; ?></strong></td>
								<td>
									<?php
										$ChildItems = explode( ",", $Group["ChildItems"] );
										?><textarea name="ChildItems"><?php
											foreach( $ChildItems as $ChildItem ) {
												echo "\n" . trim($ChildItem);
											}
										?></textarea><?php
									?>
								</td>
								<td>
									<p class="ManageStatusIcons">
										<i class="fa fa-spinner fa-spin" aria-hidden="true"></i>
										<i class="fa fa-check-square-o" aria-hidden="true"></i>
										<i class="fa fa-times-circle" aria-hidden="true"></i>
									</p>
									<button class="ManageGroup_Delete">Delete</button>
									<br>
									<button class="ManageGroup_SaveChanges">Save Changes</button>
								</td>
							</tr>
						<?php } ?>
					</tbody>

				</table>
			<?php
		}
	}

	$HandledPOSTTypes = array( "UpdateGroup", "AddGroups", "DeleteGroup", "GetGroupList" );
	if ( sizeof( $_POST ) && in_array( $_POST["type"], $HandledPOSTTypes ) ) {
      // these are posts that use ajax

      //var_dump( $_POST );
      switch(  $_POST["type"] ) {
		case "GetGroupList":
			ManageItemUsageGroups_PrintGroups( $database );
			break;
		case "UpdateGroup":
			$ChildItems = explode( ",", strtolower( str_replace( [ "\r\n", "\r", "\n" ], [ ",", ",", "," ], trim( $_POST["ChildItems"] ) ) ) );
			$ChildItems = implode( ",", array_unique( $ChildItems ) );
			$where = array( $ChildItems, trim( $_POST["ParentItem"] ) );
			$query = $database->prepare("UPDATE ItemUsageGroups SET ChildItems = ? WHERE ParentItem = ?");
			if ( $query->execute( $where ) ) {
				?>1<?php
			} else {
				?>0<?php
			}
			break;
		case "AddGroups":
			// $GroupList = explode( "\n", $_POST["AddGroups_GroupList"] );
			//
			// $OutputData["SuppliedGroups"] = sizeof( $GroupList );
			// $OutputData["NonBlankGroups"] = 0;
			// $OutputData["SkippedGroups"] = 0;
			// $OutputData["Inserts_Successful"] = 0;
			// $OutputData["Inserts_Failed"] = 0;


			foreach( $GroupList as $Group ) {
				// if ( trim( $Group ) != "" ) {
				// 	$Group = explode( "\t", $Group );
				// 	$ParentItem = trim($Group[0]);
				// 	$ChildItems = explode( ",", strtolower( trim( $Group[1] ) ) );
				// 	$ChildItems = implode( ",", array_unique( $ChildItems ) );
				// 	if ( $ParentItem != "" && $ChildItems != "" ) {
				// 		$OutputData["NonBlankGroups"]++;
				//
				// 		$where = array( $ParentItem );
				// 		$check = $database->prepare("SELECT * FROM ItemUsageGroups WHERE ParentItem = ?");
				// 		if ( $check->execute( $where ) ) {
				// 			$check = $check->fetchAll(PDO::FETCH_ASSOC);
				// 			if ( sizeof( $check ) ) {
				// 				// this is an update - skip it. Instead, we should modify the existing list
				// 				$OutputData["SkippedGroups"]++;
				// 			} else {
				// 				// we're doing an insert
				// 				$where = array( $ParentItem, $ChildItems );
				// 				$query = $database->prepare("INSERT INTO ItemUsageGroups (ParentItem, ChildItems) VALUES ( ?, ? )");
				// 				if ( $query->execute( $where ) ) {
				// 					$OutputData["Inserts_Successful"]++;
				// 				} else {
				// 					$OutputData["Inserts_Failed"]++;
				// 				}
				// 			}
				// 		}
				// 	}
				// }
			}

			//echo "<pre>"; var_dump( $OutputData ); echo "</pre>";
			// if ( $OutputData["Inserts_Successful"] == $OutputData["NonBlankGroups"] && $OutputData["SkippedGroups"] === 0 ) {
				?><p class="success">Finished - everything looks good.</p><?php
			// } else {
				?>
					<p class="error">
						Finished - it looks like there may have been a problem, see below for details.
						<?php if ( $OutputData["SkippedGroups"] !=== 0 ) { ?>
							<br>&bull; Some groups were skipped. This is usually because a group already exists for the parent item.
						<?php } ?>
						<?php if ( $OutputData["Inserts_Failed"] !=== 0 ) { ?>
							<br>&bull; Some inserts failed. Mike will probably have to take a look.
						<?php } ?>
					</p>
				<?php

			// }
			?><table border="1" width="300"><?php
			foreach( $OutputData as $key=>$value ) {
				?><tr><td><b><?php echo $key; ?></b>: </td><td><?php echo $value; ?></td></tr><?php
			}
			?></table><?php

			break;
      case "DeleteGroup":
         $where = array( $_POST["ParentItem"] );
         $Query = $database->prepare("DELETE FROM ItemUsageGroups WHERE ParentItem = ?");
         if ( $Query->execute( $where ) ) {
            ?>1<?php
         } else {
            ?>0<?php
         }
         break;
      }

	} else {
		?><!DOCTYPE html>
		<html>
		<head>
			<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
			<title>Manage Item Usage Groups</title>

			<?php include( "include/headTag/jQuery.php" ); ?>
			<?php include( "include/headTag/general.php" ); ?>
         <?php $DataTablesCopyVersion = "html5"; ?>
         <?php include( "include/headTag/datatables.php" ); ?>

			<style type="text/css">
            #sampleData {
   				width: 200px;
   			}
   			#sampleData, #sampleData td, #sampleKey, #sampleKey td {
   				border: 1px solid #ddd;
   			}
				.DisplayInlineBlock { display: inline-block !important; }
				#loadingAnimation { display: none; }

            .fa-spinner, .fa-check-square-o, .fa-times-circle {
					display: none;
				}
				.fa-check-square-o {
					color: #060;
				}
				.fa-times-circle {
					color: #f00;
				}

            .ItemCode, .WhiteBoxCode, .CraftBoxCode, .OutOfStockUntil {
               width: 100px;
            }
				#PostResults {
					display: none;
				}
				.ManageStatusIcons {
					margin: 15px;
					padding: 3px;
					float: right;
				}
				#ItemGroups button {
					margin: 5px;
				}
				#ItemGroups textarea {
					height: 100px;
				}
			</style>

			<script type="text/javascript" src="/mm5/ps/include/js/ManageItemUsageGroups.js"></script>
		</head>

		<body style="margin: 5px;">
			<?php if ( $navigationVersion == "1" ) { ?>
            <div id="leftNavAdmin"><?php include("include/nav/v1.php"); ?></div>
         <?php } else { ?>
            <div id="leftNavAdminv2"><?php include("include/nav/v2.php"); ?></div>
         <?php } ?>

			<div id="mainContentAdmin">
				<h1>Manage Item Usage Groups</h1>
	         <p>
               When tallying item usage, the items listed here will be combined.
					<br>For example, this can be used to combine usage for item 3421 with its derivatives (3421s, 3421sx, etc)
            </p>


            <?php
               if ( sizeof( $_POST ) && $_POST["type"] == "AddGroups" ) {
                  $GroupList = explode( "\n", $_POST["AddGroups_GroupList"] );
               }
            ?>

            <div id="tabs">
               <ul>
                  <li><a href="/mm5/ps/ManageItemUsageGroups.php#ViewGroups">View Groups</a></li>
                  <li><a href="/mm5/ps/ManageItemUsageGroups.php#AddGroups">Add Groups</a></li>
               </ul>
               <div id="ViewGroups">
                  <?php
                     ManageItemUsageGroups_PrintGroups( $database );
                  ?>
               </div>
               <div id="AddGroups">
                  <form action="/mm5/ps/ManageItemUsageGroups.php" method="post" enctype="multipart/form-data" name="AddItemUsageGroups" id="AddItemUsageGroups">
                     <input type="hidden" name="type" value="AddGroups">
         				<div class="pricingForm">
         					<table id="sampleData" class="nomarg" style="width: 70%;">
         						<tr>
         							<td colspan="2"><strong>Sample Data:</strong></td>
         						</tr>
         						<tr>
         							<td><div align="center"><strong>Item Number</strong></div></td>
         							<td><div align="center"><strong>Child Items</strong></div></td>
         						</tr>
         						<tr>
         							<td><strong>3421</strong></td>
         							<td>3421s,3421sx</td>
         						</tr>
         						<tr>
         							<td><strong>6704</strong></td>
         							<td>6704ST,6704STX,6704CS</td>
         						</tr>
         					</table>
         					<p>
         						<label>
         							Paste product list here, from excel:
         							<br>
         							<textarea name="AddGroups_GroupList" id="AddGroups_GroupList" style="height: 150px; width: 600px;"><?php if ( isset( $_POST["AddGroups_GroupList"] ) ) { echo $_POST["AddGroups_GroupList"]; }?></textarea>
         						</label>
         						<br><br><br>
         						<input type="submit" name="AddItemUsageGroupsSubmit" id="AddItemUsageGroupsSubmit" value="Submit">
         					</p>
         				</div>
         			</form>
               </div>
            </div>


			</div>

         <p id="loadingAnimation">
             <img src="/images/loadingAnimation.gif" height="13" width="208" alt="Loading...">
         </p>

			<div id="PostResults"></div>
			<div id="ConfirmDialog"></div>
		</body>
		</html>
		<?php
	}
	?>
<?php } else {
	include("altLogin/login.php");
}
?>
