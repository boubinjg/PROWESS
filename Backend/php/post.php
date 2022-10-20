<?php
	ini_set("log_errors", 1);
	ini_set("error_log", "/tmp/php-error.log");
	error_log( "Hello, errors!" );

	function checkHWSens(){
		return True;
	}
	function checkExpired($start, $active, $totals) {
		$checked = [];
	
		foreach($active as $exp){
			if($start <= $exp['end']){
				array_push($checked, $exp);					
			} else{
				$totals['ram'] -= $exp['ram'];
				$totals['cpu'] -= $exp['cpu'];
			}
		}
		return array($checked, $totals);
	}
	function checkExp($newExp, $conn){
		$st = $newExp['start'];
		$et = $newExp['end'];

		$query = "select * from calendar.calendar_entries where start_date+start_time <= STR_TO_DATE('$et', '%Y-%m-%d %H:%i:%s') and STR_TO_DATE('$st', '%Y-%m-%d %H:%i:%s') <= end_date+end_time;";
	
		$query2 = "select cpus, ram from calendar.testbed_entries where name = \"" . $newExp['testbed'] . "\"";
		$result = $conn->query($query);

		$experiments = [];
		if ($result->num_rows > 0){
			while($row = $result->fetch_assoc()) {
				//print_r($row);
				$start_date = $start_date = $row['start_date'];
				$start_time = $row['start_time'];
				$start_date = explode(' ', $start_date)[0];
				$start_date = strtotime($start_date . ' ' . strval($start_time));
			
				$end_date = $row['end_date'];
				$end_time = $row['end_time'];
				$end_date = explode(' ', $end_date)[0];
				$end_date = strtotime($end_date . ' ' . $end_time);
			
				$cpu = $row['cpu'];
				$ram = $row['ram'];

				$hw = $row['hardware'];
				$sens = $row['sensors'];
				
				$expArr = [
					"ram" => $ram,
					"cpu" => $cpu,
					"HW" => $hw,
					"Sens" => $sens,
					"start" => $start_date,
					"end" => $end_date,
				];
				array_push($experiments, $expArr);
			}
		} else {
			error_log("Post Error: Experiments values not read properly");
		}		
		foreach ($experiments as $exp){
			$stimes[] = $exp['start'];
		}
		
		array_multisort($experiments, SORT_STRING, $stimes);

		$totals = [
			"ram" => $newExp['ram'],
			"cpu" => $newExp['cpu'],
		];

		$result = $conn->query($query2);

		if ($result->num_rows > 0){
			$row = $result->fetch_assoc();
			$limits = [
				"ram" => $row["ram"],
				"cpu" => $row["cpus"]
			];
		}
		$activeExps = [];

		$newExpStart = strtotime($st);
		$newExpEnd = strtotime($et);
		foreach ($experiments as $exp){
					
			$curStart = $exp['start'];
			$curEnd = $exp['end'];	

			if($newExpStart > $curEnd or $newExpEnd < $curStart){
				continue;
			}

			if(count($activeExps) > 0){
				list($activeExps, $totals) = checkExpired($curStart, $activeExps, $totals);
			}
			
			array_push($activeExps, $exp);

				
			$totals['ram'] += $exp["ram"];
			$totals['cpu'] += $exp['cpu'];

			if($totals['cpu'] > $limits['cpu'] or $totals['ram'] > $limits['ram']){
				return false;
			}
		}

		return True;
	}

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

		$candidate = [
			"ram" => $ram,
			"cpu" => $cpu,
			"HW" => $hardware,
			"start" => $sd,
			"end" => $ed,
			"testbed" => $testbed
		];
		/*
		$candidate = [
                        "ram" => 30,
                        "cpu" => 11,
                        "HW" => ["mic1" => True, "mic2", False],
       			"start" => "2022-10-21 07:00:00",
			"end" => "2022-10-21 22:00:00",
                        "testbed" => "corehub"
                ];*/


		if(checkExp($candidate, $conn) == false) {
			http_response_code(400);
			echo "Experiment Error: can not be scheduled under provided parameters";
			return;	
		}	
		
		if($conn -> connect_error) {
			die("connection failed: " . $conn->connect_error);
		}

		

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
