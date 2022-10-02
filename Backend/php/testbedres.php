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
	
		$name = $_GET['name'];

		$conn = new mysqli($servername, $username, $password, $dbname, $port);

		if($conn -> connect_error) {
			die("connection failed: " . $conn->connect_error);
		}
			
		$sql = "SELECT * from calendar.testbed_entries where name = '$name'";
		$result = $conn->query($sql);
	
		if ($result->num_rows > 0){
			$entries = []; 
			while($row = $result->fetch_assoc()) {
				$ram = $row['ram'];
				$cpus = $row['cpus'];
				$sensors = $row['sensors'];
				$hardware = $row['hardware'];

				$ent = [$ram, $cpus, $sensors, $hardware];
				$entries = $ent;
			}
			$res = ["message"=>$entries];
			header('Content-type: application/json');
			echo json_encode($res);

		} else {
			echo "no results";
		}
		$conn->close();

	} else {
		print "<p> How did you get in here? </p>";
	}
?>
