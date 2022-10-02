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

		$id = $_GET['idx'];
		$user = $_GET['user'];
		

		$sql = "SELECT * from calendar_entries where user = '$user' and id='$id'";
		$result = $conn->query($sql);
	
		if ($result->num_rows > 0){
			$filename = '/edgestorage/export/' . $id . '.zip';
			
			header('Content-Description: File Transfer');
			header('Content-Type: application/octet-stream');
			header("Cache-Control: no-cache, must-revalidate");
			header("Expires: 0");
			header('Content-Disposition: attachment; filename="output.zip"');
			header('Content-Length: ' . filesize($filename));
			header('Pragma: public');

			flush();

			readfile($filename);

			die();
		} else {
			http_response_code(400);
			echo "No Experiment Found";
			return;
		}
		$conn->close();

	} else {
		print "<p> How did you get in here? </p>";
	}
?>
