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

		if($conn -> connect_error) {
			die("connection failed: " . $conn->connect_error);
		}
		
		$sql = "SELECT name, eventcolor from calendar.testbed_entries";
		$result = $conn->query($sql);
	
		if ($result->num_rows > 0){
			$entries = []; 
			while($row = $result->fetch_assoc()) {
				$name = $row['name'];
				$eventcolor = $row['eventcolor'];

				$ent = ['name'=>$name, 'eventcolor'=>$eventcolor];
				array_push($entries, $ent);
			}
			$res = ["message"=>$entries];
			header('Content-type: application/json');
			echo json_encode($res);

		} else {
			echo "no results";
		}
		$conn->close();

	} else {
		print "<p> Authentication Failed </p>";
	}
?>
