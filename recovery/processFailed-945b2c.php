<?php
include_once( "../../ps/functions.php" );
dbConnect();
$database = dbConnect( "pdo" );
include( "include/session.php" );
if ( isLoggedIn( "admin", $database, "pdo" ) || isLoggedInAlt( "any", "admin" ) ) {
	echo "<br>working";
	$serverPath = $_SERVER['DOCUMENT_ROOT']."/";

	//$host = "www.fashioncraft.com";
	$host = $_SERVER['HTTP_HOST'];

	$endFlag = "ENDORDEREND";
	$orders = "";

	if ( $_REQUEST["erase"] ) {
		$file = fopen( "failedOrders.txt", "w" );
		fclose( $file );
		echo "file was erased";
	} else {
		//$file = fopen( "/sites/fashioncraft.com/protect/failedOrders.txt", "r" );
		$fileName = $_REQUEST["autoWrite"] ? "autoFailedOrders.txt" : "failedOrders.txt";
		$file = fopen( $fileName, "r" );
		while ( !feof( $file  ) ) {
		  $line = fgets( $file );
		  $orders .= $line;
		}
		fclose( $file );

		//$orders = file_get_contents( $fileName );

		$orders = str_replace( "﻿", "", $orders );

		echo "<br><br>orders:<br>" . $orders . "<br><br>";

		$orders = explode ( $endFlag, $orders );
		$xmlDeclaration = "<?xml version=\"1.0\" encoding=\"utf-8\"?>";

		foreach ( $orders as $data ) {
			if ( trim( $data ) ) {
				echo "<br>trimmed data:<br>" . trim( $data ) . "<br><br>";
				/*$data = str_replace ( "<?xml version=\\\"1.0\\\" encoding=\\\"utf-8\\\"?>", "<?xml version=\"1.0\" encoding=\"utf-8\"?>", $data );*/
				$data = $xmlDeclaration . $data;
				echo "<br>posting to $host...";
				var_dump( htmlentities( $data ) );
				$postData = isset( $_REQUEST["sendFCEmail"] ) ? "FC=1&order=" . urlencode( $data ) : "PF=1&order=" . urlencode( $data );
				$postPath = !isset( $_REQUEST["beta"] ) ? "/ps/order/incoming.php" : "/ps/order/incoming.php?beta=1";
				if ( isset( $_REQUEST["Nav2016"] ) ) {
					$postPath = "/ps/order/incoming.nav2016.php";
				}
				if ( isset( $_REQUEST["testV2"] ) ) {
					$postPath = str_replace(".php", "v2.php", $postPath);
				}

				

				if ( true ) {
					//$postPath = "/ps/order/incoming.nav2016.php";
				}

				echo "<br>posting to " . $postPath;
				$output = httpSpawnv2( $postData, $postPath, $host, false, true );
				echo "<br>Data Updated<br>New Data:<br>";
				echo $data;
				echo "<br>Output:<br>\r\n $output <br><br>\r\n\r\n";
				sleep(2);
			}
		}

		//http_spawn( "order=" . urlencode( $theXML ), "/includes/Fusionv3/incoming.php", "www.fashioncraft.com", false );

	} // if ( $_REQUEST["erase"] ) {

} else {
	include("altLogin/login.php");
}
?>