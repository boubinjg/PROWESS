// server/index.js


const cfg = require('./config.json')

const express = require("express");
const PORT = process.env.PORT || cfg.backendPort;

const app = express();
var https = require('https')
var http = require('http')
var fs = require('fs')

var options = {
   key: fs.readFileSync('client-key.pem'),
   cert: fs.readFileSync('cert.cer')
};

const util = require('util')

var bodyParser=require('body-parser')

var cors = require('cors');
var mysql = require('mysql')
var moment = require('moment')

//var SamlStrategy = require('passport-saml').Strategy;
//app.use(cors({origin: 'https://'+cfg.domain}));

//https.createServer(options, app).listen(cfg.backendPort);
app.listen(3001, () => {})

app.use(bodyParser.urlencoded({ extend: true }));

app.get("/testbeds", (req,res) => {
    var con = mysql.createConnection({
        host: cfg.databaseIP,
        user: "root",
        password: cfg.databasePW,
        port: cfg.databasePort
    });

    con.connect(function(err) {
        if (err) throw err;
        console.log("Connected To Database")
    });

    con.query('select name, eventcolor from calendar.testbed_entries', function(err, response) {
        if(err) throw err;
        ret = []
        var idx = 0
        for(var key in response) {
            var tb = response[key]
            ret.push(tb)
            console.log(util.inspect(tb))
        }

        res.json({message : ret})
    });
    con.end()
});

app.get("/testbedres", (req, res) => {
    var con = mysql.createConnection({
        host: cfg.databaseIP,
        user: "root",
        password: cfg.databasePW,
        port: cfg.databasePort
    });

    var testbed = req.param('name')
    console.log('TestbedRes')
    console.log(testbed)

    con.connect(function(err) {
        if (err) throw err;
        console.log("Connected To Database")
    });

    con.query('SELECT * from calendar.testbed_entries where name = \''+testbed+'\'', function(err, response) {
        if(err) throw err;
        console.log(response)

	var ret = []
	for(var key in response) {
		//var ret = {response['ram'], response['cpus'], response['sensors'], response['hardware']}
		var row = response[key]
		ret.push(row["ram"])
		ret.push(row["cpus"])
		ret.push(row["sensors"])
		ret.push(row["hardware"])
	}
	res.json({message : ret})
    });
    con.end()
    //fs.writeFile('/edgestorage/export/1.zip', zip.generate(options), 'binary', function(error))
});


app.get("/api", (req, res) => {
    var con = mysql.createConnection({
        host: cfg.databaseIP,
        user: "root",
        password: cfg.databasePW,
        port: cfg.databasePort
    });

    con.connect(function(err) {
        if (err) throw err;
        console.log("Connected To Database")
    });

    con.query('select * from calendar.calendar_entries', function(err, response) {
        if(err) throw err;
        ret = []
        var idx = 0
        for(var key in response) {
            var indResp = response[key]
            console.log(indResp.start_date)
            console.log(util.inspect(indResp))
            var sd = indResp.start_date.toISOString()
            var start_date = sd.split('T')[0] + ' '+ indResp['start_time']
            console.log(sd)
            var ed = indResp.end_date.toISOString()
            end_date = ed.split('T')[0] + ' '+ indResp['end_time']
            var text = indResp['description']
	    var stat = indResp['status']
	    var tb = indResp['testbed']
            var calEnt = {start_date: start_date, end_date: end_date, text: text, id: idx, status: stat, testbed: tb}
            ++idx
            ret.push(calEnt)
            console.log(util.inspect(calEnt))
        }

        res.json({message : ret})
    });
    con.end()
});

app.get("/download", (req, res) => {
    var con = mysql.createConnection({
        host: cfg.databaseIP,
        user: "root",
        password: cfg.databasePW,
        port: cfg.databasePort
    });

    var user = req.param('user')
    var idx = req.param('idx')

    con.connect(function(err) {
        if (err) throw err;
        console.log("Connected To Database")
    });

    con.query('SELECT * from calendar.calendar_entries where user = \''+user+'\' and id='+idx, function(err, response) {
        if(err) throw err;
        console.log(response)
	if(response.length > 0) {
		try{
			var fp = '/edgestorage/export/'+idx+'.zip';
			var stat = fs.statSync(fp);

    			res.writeHead(200, {
    				'Content-Type': 'application/zip',
        			'Content-disposition': 'attachment; filename=output.zip',
				'Content-Length': stat.size
    			});

    			var readStream = fs.createReadStream(fp);
       			readStream.on('open', function() {
    				readStream.pipe(res);
    			});
		} catch(error){
			console.log('resource not found')
			res.sendStatus(503)
		}
	}
	else {
		res.sendStatus(404)
	}
    });
    con.end()
    //fs.writeFile('/edgestorage/export/1.zip', zip.generate(options), 'binary', function(error))
});



app.post("/postDel", (req, res) =>{
    console.log('Got Body: ',req.body)
    var sql = 'DELETE from calendar.calendar_entries where user = \''+req.body.user+'\' and id='+req.body.idx;
    console.log(sql)
    var con = mysql.createConnection({
        host: cfg.databaseIP,
        user: "root",
        password: cfg.databasePW,
        port: cfg.databasePort
    });
    con.connect(function(err) {
        if (err) throw err;
        console.log("Connected To Database")
    });

    con.query(sql, function(err, response) {
        if(err) throw err;
    });
    con.end()
    res.sendStatus(200);
});



app.post("/postExps", (req, res) =>{
    console.log('Got Body: ',req.body)
    var sql = 'select * from calendar.calendar_entries where user = \"'+req.body.user+'\"';
    console.log(sql)
    var ret = []
    var con = mysql.createConnection({
        host: cfg.databaseIP,
        user: "root",
        password: cfg.databasePW,
        port: cfg.databasePort
    });
    con.connect(function(err) {
        if (err) throw err;
        console.log("Connected To Database")
    });

    con.query(sql, function(err, response) {
        if(err) throw err;
        console.log('Submitted To DB: '+response)
        console.log(util.inspect(response))
        for(var key in response){
            var indResp = response[key]
            var sd = indResp.start_date.toISOString()
            var start_date = sd.split('T')[0] + ' '+ indResp['start_time']
            var ed = indResp.end_date.toISOString()
            end_date = ed.split('T')[0] + ' '+ indResp['end_time']
            var text = indResp['description']
            var container = indResp['container']
	    var containerYAML = indResp['containerYAML']
	    var stat = indResp['status']
            console.log('container: '+container)
            var calEnt = {start_date: start_date, end_date: end_date, container: container, containerYAML: containerYAML, text: text, id: indResp.id, status: stat}
            ret.push(calEnt)
            console.log(util.inspect(calEnt))

        }
        res.json({message: ret});

    });
    con.end()
    console.log(util.inspect(ret))
});

app.post("/post", (req, res) => {
    console.log('Got Body:', req.body);
    var sql = 'INSERT INTO calendar.calendar_entries (user, container, containerYAML, volume, start_date, end_date, start_time, end_time, description, testbed, ram, cpu, sensors, hardware, status) VALUES (';

    body = req.body
    var sd = moment(body.StartDate+'T'+body.starttime)
    var ed = moment(body.endDate+'T'+body.endtime)
    var duration = ed.diff(sd, 'seconds');
    console.log(duration)
    if(duration < 0){
        res.statusCode = 400;
        res.setHeader('Content-Type','text/plain')
        res.end('End Date Before Start Date')
        return;
    }
    else if (duration > 604800 ){
        res.statusCode = 400;
        res.setHeader('Content-Type','text/plain')
        res.end('Experiment Duration Must Be Less Than 1 Week')
        return;
    }
    else if(body.container == '' && body.containerYAML == ''){
        res.statusCode = 400;
        res.setHeader('Content-Type','text/plain')
        res.end('Invalid Container Name')
        return;
    }
    else if(body.description == ''){
        res.statusCode = 400;
        res.setHeader('Content-Type','text/plain')
        res.end('Please Include an Experiment Description')
        return;
    }
    console.log('container: '+body.container)
    console.log('desc: '+body.description)
    console.log('user: '+body.user)

    sql += '\''+body.user+'\'' + ','
    sql += '\''+body.container+'\'' + ','
    sql += '\''+body.containerYAML+'\'' + ','
    sql += '\''+body.volume+'\'' + ','
    sql += 'STR_TO_DATE(\''+body.StartDate.split('T')[0] + '\',\'%Y-%m-%d\'),'
    sql += 'STR_TO_DATE(\''+body.endDate.split('T')[0] + '\',\'%Y-%m-%d\'),'
    sql += 'STR_TO_DATE(\''+body.starttime + '\',\'%H:%i:%s\'),'
    sql += 'STR_TO_DATE(\''+body.endtime + '\',\'%H:%i:%s\'),'
    sql += '\''+body.description+'\'' + ','
    sql += '\''+body.testbed+'\'' + ','
    sql += body.ram + ','
    sql += body.cpu + ','
    sql += '\"'+body.sensors +'\"'+ ','
    sql += '\"'+body.hardware+'\"' + ','
    sql += '\''+body.status+'\'' + ')'

    console.log(sql)
    var con = mysql.createConnection({
        host: cfg.databaseIP,
        user: "root",
        password: cfg.databasePW,
        port: cfg.databasePort
    });
    con.connect(function(err) {
        if (err) throw err;
        console.log("Connected To Database")
    });


    con.query(sql, function(err, response) {
        if(err) throw err;
        console.log('Submitted To DB: '+response)
    });

    con.end()
    res.sendStatus(200);

});


