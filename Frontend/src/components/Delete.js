import React, { Component } from 'react';
import Scheduler from '../components/Scheduler';
import 'react-dates/initialize';
import DatePicker from "react-datepicker"
import moment from "moment"
import { DateRangePicker, SingleDatePicker, DayPickerRangeController } from 'react-dates';
import 'react-dates/lib/css/_datepicker.css';
import 'antd/dist/antd.css'
import { TimePicker } from 'antd'
import momentPropTypes from 'react-moment-proptypes'
import PropTypes from 'prop-types'
import {Table, Form, FormGroup, Checkbox, Col, Button, Navbar, Nav, NavDropdown,FormControl} from "react-bootstrap"
import 'bootstrap/dist/css/bootstrap.min.css'
import '../App.css';
import $ from 'jquery';
import { saveAs } from 'file-saver'
import * as JSZip from 'jszip'
import "./style.css"

const data = [];
const cfg = require('../config.json')

const util = require('util')

class Delete extends Component {

    constructor(props) {
        super(props);
        this.state = {
                        user: 'default',
                        startdate: null,
                        enddate:  null,
                        starttime: moment('00:00:00', 'HH:mm:ss').format('HH:mm:ss'),
                        endtime:  moment('00:00:00', 'HH:mm:ss').format('HH:mm:ss'),
                        focusedEnd: false,
                        container: null,
                        allMics: false,
                        mic1: false,
                        mic2: false,
                        mic3: false,
                        cam1: false,
                        cam2: false,
                        cam3: false,
                        allCams: false,
                        allSens: false,
                        sdr: false,
                        gpu: false,
                        test: 'test',
                        expdescription: '',
                        id: 0,
                        calendarData: [],
                        myExps: [],
                        currentIds: []
                    };
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.fetch = this.fetch.bind(this);
        this.fetchMyExps = this.fetchMyExps.bind(this);
    }
    handleChange(time, variable){
        if(variable == 'starttime')
            this.setState({starttime: time.format('HH:mm:ss')})
        else if(variable == 'endtime')
            this.setState({endtime: time.format('HH:mm:ss')})
    }
    handleSubmit(event){
        event.preventDefault();
        var jsondata = {user: this.state.user,
                    container: this.state.container,
                    StartDate: this.state.startdate.format('YYYY-MM-DD'),
                    endDate: this.state.enddate.format('YYYY-MM-DD'),
                    starttime: this.state.starttime,
                    endtime: this.state.endtime,
                    description: this.state.expdescription,
                    all_sensors: this.state.allSens,
                    all_mics: this.state.allMics,
                    mic1: this.state.mic1,
                    mic2: this.state.mic2,
                    mic3: this.state.mic3,
                    all_cams: this.state.allCams,
                    cam1: this.state.mic1,
                    cam2: this.state.mic2,
                    cam3: this.state.mic3,
                    gpu: this.state.gpu,
                    sdr: this.state.sdr
                }

        console.log(jsondata)

        var expStart = this.state.startdate.format('YYYY-MM-DD')
        var expStartTime = this.state.starttime
        var expEnd = this.state.enddate.format('YYYY-MM-DD')
        var expEndTime = this.state.endtime
        var text = this.state.container + '\n' + this.state.expdescription
        var newExp = {start_date: expStart +' '+ expStartTime, end_date: expEnd+' '+expEndTime,text: text, id: this.state.id}

        console.log(jsondata.endDate)

        //this.setState({calendarData: this.state.calendarData.concat(newExp)})
        //this.setState({id: this.state.id+1})

        $.ajax({
            url: 'https://'+cfg.domain+'php/post.php',
            type: 'POST',
            data: jsondata,
            success: function(msg) {
                console.log(msg);
            },
            error: function(request, status, error){
                    alert(request.responseText);
            }
        });
        this.fetch()
    }
    fetchShib() {
    	var context = this;
	fetch('https://'+cfg.domain+'/Shibboleth.sso/Session')
  		.then(response => response.json())
  		.then((jsonData) => {
    	     		console.log(jsonData)
			console.log('$$$$$$$$$$$$$$$$$$$')
                        const UID = jsonData.attributes[4].values[0].split('@')[0]
			console.log(jsonData.attributes[4].values[0].split('@')[0])
			console.log(UID)
			this.setState({ user: UID})
			console.log('User')
			console.log(this.state.user)
			console.log('$$$$$$$$$$$$$$$$$$$')
			this.fetchMyExps()
   		})
               .catch((error) => {
                 console.error(error)
               })
    }

    fetchMyExps() {
        var context = this;
        var jsondata = {user: this.state.user}

        $.ajax({
            url: 'https://'+cfg.domain+'/php/postExps.php',
            type: 'POST',
            data: jsondata,
            success: function(response) {
                context.setState({
                    myExps: response.message
                });
                console.log(util.inspect(response))
            }
        });
    }
    fetch() {
        var context = this;

        $.ajax({
            url: 'https://'+cfg.domain+'/php/api.php',
            method: 'GET',
            data: data,
            success: function(response) {
                context.setState({
                    calendarData: response.message
                });
            }
        });
    }
    componentDidMount(){
        console.log('Mounting!')
        this.fetch();
	this.fetchShib();
        this.fetchMyExps();
    }
    handleButtonInput(e) {
        console.log(e.target.value)
        var context = this
        var data = {user: this.state.user, idx: e.target.value}
        console.log(data)
        $.ajax({
            url: 'https://'+cfg.domain+'/php/postDel.php',
            method: 'post',
            data: data,
            success: function(response) {
            }
        });
        this.fetch();
        this.fetchMyExps();
    }
    handleDownload(e) {
        console.log(e.target.value)
        var context = this;
        var user = this.state.user;
	var idx = e.target.value;
        console.log(data)

	window.open('https://'+cfg.domain+'/php/download.php?user='+user+'&idx='+idx)


        this.fetch();
        this.fetchMyExps();
    }

    myExperiments(){
        console.log('MyExps: ')
        console.log(util.inspect(this.state.myExps))
        var list = []
        const self = this;
	if(this.state.myExps != undefined)
		for(var i=0; i<this.state.myExps.length; i++){
		    var exp = this.state.myExps[i]
		    var label = 'Container: '+exp.container+' '
		    var idx = exp.id
		    this.state.currentIds.push(idx)
		    var buttonVar = "primary"
		    if(exp.status.substring(0,5) == 'error')
			buttonVar = "danger"
		    var bv = ""
		    if(exp.status.substring(0,8) == 'Complete') {

			var bv =  <Button value={idx} variant={buttonVar} type="submit" onClick={e => this.handleDownload(e, "value")} >
				    Download Results
				</Button>
		    }
		    var listItem =
			<tr>
			    <td>{exp.id}</td>
			    <td>{exp.container}</td>
			    <td>{exp.start_date}</td>
			    <td>{exp.end_date}</td>
			    <td>{exp.status} <br/> {bv} </td>
			    <td>
				<Button value={idx} variant={buttonVar} type="submit" onClick={e => this.handleButtonInput(e, "value")} >
				    Delete
				</Button>
			    </td>
			</tr>
		    list.push(listItem)
		}
		console.log('CURRENT IDS:')
		console.log(this.state.currentIds)
        return list
    }
    render() {
        const exps = this.myExperiments()

        return (
            <div>
                <Navbar className="color-nav-prowess" expand='xl'>
                  <Navbar.Brand href="#home">Pomerene Lab IoT Testbed Experiment Scheduler</Navbar.Brand>
                  <Navbar.Toggle aria-controls="basic-navbar-nav" />
                  <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="mr-auto">
                      <Nav.Link href="/">Schedule a New Experiment</Nav.Link>
                      <Nav.Link href="/Delete">View My Scheduled Experiments</Nav.Link>
                    </Nav>
                 </Navbar.Collapse>
                </Navbar>

                <div class="conatainer">
                <div class='row'>
                <div class='col-xl'>
                <div>
                    <h1>View My Scheduled Experiments</h1>
                </div>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Experiment ID</th>
                            <th>Container</th>
                            <th>Start Time</th>
                            <th>End Time</th>
			    <th>Status</th>
                            <th>Delete</th>
                        </tr>
                    </thead>
                    <tbody>
                        {exps}
                    </tbody>
                </Table>
                </div>
                </div>
                <div class="row">
                <div className='scheduler-container'>
                    <Scheduler events={this.state.calendarData}/>
                </div>
                </div>
                </div>
            </div>
        );
    }
 }
 export default Delete;
