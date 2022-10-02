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

		$user = $_POST['user'];
		$id = $_POST['idx'];

		$sql = "DELETE from calendar.calendar_entries where user='$user' and id='$id'";

		if (!$conn->query($sql)) {
			echo("Error: " . $conn -> error);
		} else {
			echo "Experiment Deleted";
		}
		$conn->close();

	} else {
		print "<p> How did you get in here? </p>";
	}
?>
