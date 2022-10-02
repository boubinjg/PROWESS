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
		
		$user = $_POST['user'];
		$sql = "SELECT * from calendar_entries where user = '$user'";
		$result = $conn->query($sql);
	
		if ($result->num_rows > 0){
			$entries = []; 
			while($row = $result->fetch_assoc()) {
				$start_date = $row['start_date'];
				$start_time = $row['start_time'];
				$start_date = explode(' ', $start_date)[0];
				$start_date = $start_date . ' ' . strval($start_time);				
				$end_date = $row['end_date'];
				$end_time = $row['end_time'];
				$end_date = explode(' ', $end_date)[0];
				$end_date = $end_date . ' ' . $end_time;				

				$container = $row['container'];
				$containerYAML = $row['containerYAML'];
								

				$text = $row['text'];
				$status = $row['status'];
				$id = $row['id'];
				$stat = $row['status'];

				$ent = ['start_date'=>$start_date,'end_date'=>$end_date,'container'=>$container,'containerYAML'=>$containerYAML,"text"=>$text,"id"=>$id,"status"=>$status];

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
		print "<p> How did you get in here? </p>";
	}
?>
