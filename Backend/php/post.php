<?php
	$cfg_in = file_get_contents('config.json');
	$json = json_decode($cfg_in, true);

	$servername = $json['databaseIP'];
	$username = $json['databaseUser'];
	$password = $json['databasePW'];
	$dbname = "calendar";
	$port = $json['databasePort'];


	$authtype = $json['authtype'];

	$auth = False;

	if($authtype == '"shibboleth"') {
		
		$attributes = array('displayName', 'mail', 'eppn',
                    'givenName', 'sn', 'affiliation', 'unscoped-affiliation');
		
		$name = $attributes[0];
		if(isset($_SERVER[$name])) {
			$auth = True;
		}
	} else {
		$auth = True;
	}
	
	if($auth == True) {
		$conn = new mysqli($servername, $username, $password, $dbname, $port);


		$StartDate = $_POST['StartDate'];
		$StartTime = $_POST['starttime'];
		$endDate = $_POST['endDate'];
		$endTime = $_POST['endtime'];
		$sd = $_POST['StartDate'] . ' ' . $_POST['starttime'];
		$ed = $_POST['endDate'] . ' ' .  $_POST['endtime'];

		$diff = strtotime($ed) - strtotime($sd);
	
		$yaml = implode($_POST['containerYAML'], ',');
		$container = implode($_POST['container'], ',');
		$desc = $_POST['description'];
		$user = $_POST['user'];
		$volume = implode($_POST['volume'], ',');
		$testbed = $_POST['testbed'];
		$cpu = $_POST['cpu'];
		$ram = $_POST['ram'];
		$sensors = implode($_POST['sensors'], ',');
		$hardware = implode($_POST['hardware'], ',');
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

		if($container[0]=='' and $yaml[0]=='') {
			http_response_code(400);
			echo "Please specify a container";
			return;
		}
		if($desc=='') {
			http_response_code(400);
			echo "Please provide a description of your experiment";
			return;
		}
		
		if($conn -> connect_error) {
			die("connection failed: " . $conn->connect_error);
		}


		echo $sql;

		$sql = "INSERT into calendar.calendar_entries (user, container, containerYAML, volume, start_date, end_date, start_time, end_time, description, testbed, ram, cpu, sensors, hardware, status) VALUE('$user','$container','$yaml','$volume',STR_TO_DATE('$StartDate', '%Y-%m-%d'),STR_TO_DATE('$endDate', '%Y-%m-%d'),STR_TO_DATE('$StartTime','%H:%i:%s'),STR_TO_DATE('$endTime','%H:%i:%s'),'$desc','$testbed','$ram','$cpu','$sensors','$hardware','$status')"; 
				
		if (!$conn->query($sql)) {
			echo("Error: " . $conn -> error);
		} else {
			echo "Experiment Successfully Scheduled";
		}
		$conn->close();

	} else {
		print "<p> How did you get in here? </p>";
	}
?>
