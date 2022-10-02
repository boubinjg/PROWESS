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
		print "<p> How did you get in here? </p>";
	}
?>
