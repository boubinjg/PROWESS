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
		
		$sql = "SELECT * from calendar_entries";
		$result = $conn->query($sql);
	
		if ($result->num_rows > 0){
			$id = 0;
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


				
				$text = $row['text'];
				$status = $row['status'];
				$tb = $row['testbed'];

				$ent = ['start_date'=>$start_date,"end_date"=>$end_date,"text"=>$text,"id"=>$id,"status"=>$status,"testbed"=>$tb];

				array_push($entries, $ent);

				$id += 1;
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
