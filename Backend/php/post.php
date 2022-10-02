<?php
	$servername = '127.0.0.1';
	$username = "root";
	$password = "my-secret-pw";
	$dbname = "calendar";
	$port = "3306";

	$attributes = array('displayName', 'mail', 'eppn',
                    'givenName', 'sn', 'affiliation', 'unscoped-affiliation');



	$name = $attributes[0];
	//if( isset($_SERVER[$name])) {
	if(true) {
	
		$conn = new mysqli($servername, $username, $password, $dbname, $port);


		$StartDate = $_POST['StartDate'];
		$StartTime = $_POST['StartTime'];
		$endDate = $_POST['endDate'];
		$endTime = $_POST['endTime'];
		$sd = $_POST['StartDate'] . ' ' . $_POST['StartTime'];
		$ed = $_POST['endDate'] . ' ' .  $_POST['endTime'];

		$diff = strtotime($ed) - strtotime($sd);
	
		$yaml = $_POST['containerYAML'];
		$container = $_POST['container'];
		$desc = $_POST['description'];
		$user = $_POST['user'];
		$volume = $_POST['volume'];
		$testbed = $_POST['testbed'];
		$cpu = $_POST['cpu'];
		$ram = $_POST['ram'];
		$sensors = $_POST['sensors'];
		$hardware = $_POST['hardware'];
		$status = $_POST['status'];

		if($diff < 0){
			http_response_code(400);
			echo "End Time before Start Time";
			return;
		}
		
		if($diff > 604800 ) {
			http_response_code(400);
			echo "Experiment Duration Must Be Less Than 1 Week";
			return;
		}

		if($container=="['']" and $yaml=="['']") {
			http_response_code(400);
			echo "Please specify a container";
			return;
		}
		if($desc=="''") {
			http_response_code(400);
			echo "Please provide a description of your experiment";
			return;
		}
		
		if($conn -> connect_error) {
			die("connection failed: " . $conn->connect_error);
		}
	
		$sql = "INSERT into calendar.calendar_entries (user, container, containerYAML, volume, start_date, end_date, start_time, end_time, description, ram, cpu, sensors, hardware, status) VALUE('$user','$container','$yaml','STR_TO_DATE($StartDate, '%Y-%m-%d')','STR_TO_DATE($endDate, '%Y-%m-%d')','STR_TO_DATE($StartTime,'%H:%i:%s')','STR_TO_DATE($endTime,'%H:%i:%s')','$desc','$testbed','$ram','$cpu','$sensors','$hardware','$status')"; 
		
 	
		
		//$result = $conn->query($sql);
		//$resp = $result->fetch_assoc();

		echo $sql;
		//echo implode(" ", $resp);
	
		$conn->close();

	} else {
		print "<p> How did you get in here? </p>";
	}
?>
