import React, { Component, Fragment } from 'react';
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
import {Form, FormGroup, Checkbox, Col, Button, Navbar, Nav, NavDropdown,FormControl} from "react-bootstrap"
import 'bootstrap/dist/css/bootstrap.min.css'
import '../App.css';
import $ from 'jquery';
import Select from 'react-select';

const util = require('util')
const cfg = require('../config.json')

const data = []

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
                        user: 'default',
                        startdate: null,
                        enddate:  null,
                        starttime: moment('00:00:00', 'HH:mm:ss').format('HH:mm:ss'),
                        endtime:  moment('00:00:00', 'HH:mm:ss').format('HH:mm:ss'),
                        focusedEnd: false,
                        container: [""],
                        containerYAML: [""],
			            volume: [""],
                        test: 'test',
                        expdescription: '',
                        id: 0,
                        calendarData: [],
			            testbedData: [],
                        message: 'testtest',
			            status: 'Submitted',
                        containers: 1,
                        volumes: 1,
                        containersYaml: 1,
                        testbedSelect: 'none',
                        ram: '1',
                        cpu: '0.5',
                        sensors: [],
                        hardware: [],
                        tbRam: null,
                        tbCpu: null,
                        tbSensors: [],
			            tbHardwre: []
                    };
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.fetch = this.fetch.bind(this);
    }
    handleChange(time, variable){
	if(variable == 'starttime')
	    try {
            	this.setState({starttime: time.format('HH:mm:ss')})
            } catch(e) {this.setState({starttime: null})}
	else if(variable == 'endtime')
	    try {
            	this.setState({endtime: time.format('HH:mm:ss')})
    	    } catch(e) {this.setState({endtime: null})}
    }
    handleSubmit(event){
        event.preventDefault();
        var jsondata = {user: this.state.user,
                    container: this.state.container,
		    containerYAML: this.state.containerYAML,
                    volume: this.state.volume,
                    StartDate: this.state.startdate.format('YYYY-MM-DD'),
                    endDate: this.state.enddate.format('YYYY-MM-DD'),
                    starttime: this.state.starttime,
                    endtime: this.state.endtime,
                    description: this.state.expdescription,
                    testbed: this.state.testbedSelect,
                    ram: this.state.ram,
                    cpu: this.state.cpu,
                    sensors: this.state.sensors,
                    hardware: this.state.hardware,
                    status: this.state.status
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
        var context = this;
        $.ajax({
            url: 'https://'+cfg.domain+':'+cfg.backendPort+'/post',
            type: 'POST',
            data: jsondata,
            success: function(msg) {
                    var text = 'Experiment Successfully Scheduled from '+context.state.startdate.format('YYYY-MM-DD') + ' ' + context.state.starttime + ' to '+ context.state.enddate.format('YYYY-MM-DD') + ' ' +context.state.endtime;
                    alert(text)
                    console.log(msg);
            },
            error: function(request, status, error){
                    alert(request.responseText);
            }
        });
        this.fetch()
    }

   fetch() {
        var context = this;

        $.ajax({
            url: 'https://'+cfg.domain+':'+cfg.backendPort+'/api',
            method: 'GET',
            data: data,
            success: function(response) {
		var resp = response.message
		console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
		for (var key in response.message){
			console.log(context.state.testbedData)
			//console.log(context.state.testbedData.length)
			var tb = response.message[key].testbed
			for(var i=0; i< context.state.testbedData.length ;++i){
				var tbData = context.state.testbedData[i]
				if(tbData.name == response.message[key].testbed){
					console.log('hit')
					response.message[key].color = '#'+tbData.eventcolor
				}
			}
		}
			console.log(response.message[key])
		context.setState({
                    calendarData: response.message
                });
            }
        });
    }
    fetchShib() {
        console.log(cfg.domain)
        console.log('^^^^^^^^^^^^^^^^^')
	fetch('https://'+cfg.domain+'/Shibboleth.sso/Session')
  		.then(response => response.json())
  		.then((jsonData) => {
    		// jsonData is parsed json object received from url
    	     		console.log(jsonData)
			console.log('$$$$$$$$$$$$$$$$$$$')
                        const UID = jsonData.attributes[4].values[0].split('@')[0]
			console.log(jsonData.attributes[4].values[0].split('@')[0])
			console.log(UID)
			this.setState({ user: UID})
			console.log('User')
			console.log(this.state.user)
			console.log('$$$$$$$$$$$$$$$$$$$')
   		})
               .catch((error) => {
                 // handle your errors here
                 console.error(error)
               })
    }
    fetchTBs() {
	console.log('###################')
	var context = this
        $.ajax({
            url: 'https://'+cfg.domain+':'+cfg.backendPort+'/testbeds',
            method: 'GET',
            data: data,
            success: function(response) {
                context.setState({
			testbedData: response.message
                });
		console.log('TB Response:')
		console.log(response.message)
		context.fetch()
            }
        });
    }
    fetchTBRes(name) {
    	console.log('FETCH TB Results')
	var context = this
        $.ajax({
            url: 'https://'+cfg.domain+':'+cfg.backendPort+'/testbedres?name='+name,
            method: 'GET',
            data: data,
            success: function(response) {
                context.setState({
                    testbedRes: response.message
                });
		console.log(context.state.testbedSelect)
		console.log('TB Response:')
		console.log(response.message)
		console.log(response.message[0])

		context.setState({ram: 0})
		context.setState({cpu: 0})

		context.setState({tbRam: response.message[0]})
		context.setState({tbCpu: response.message[1]})
		var sensors = response.message[2]

		if(sensors == 'None')
			context.setState({tbSensors: null})
		else {
			try{
				const result = response.message[2].split('+')
				context.setState({tbSensors: result})
				console.log(result)
			}catch(exception) {
				console.log('Sensor Parsing Error')
			}
		}
		var hardware = response.message[3]
		if(hardware == 'None')
			context.setState({tbHardware: null})
		else {
			try{
				const result = response.message[3].split('+')
				context.setState({tbHardware: result})
				console.log(result)
			} catch(exception) {
				console.log('Hardware Parsing Error')
			}
		}
		var ret = []
		if(context.state.tbSensors != null) {
			for(var i=0; i<context.state.tbSensors.length; i++){
				ret.push(false)
			}
			context.setState({sensors: ret})
		}
		ret = []
		if(context.state.tbHardware != null) {
			for(var i=0; i<context.state.tbHardware.length; i++){
				ret.push(false)
			}
			context.setState({hardware: ret})
		}
            }
        });

    }

    componentDidMount(){
        console.log('Mounting!')
        this.fetchTBs();
	this.fetch();
	this.fetchShib();
	this.fetchTBRes();
    }
    buttonAdd() {
        if(this.state.containers < 20) {
            this.setState({ containers: this.state.containers+1 })
            const list = [...this.state.container, ""]
            this.setState({ container: list})
        }
    }
    buttonSub() {
        if(this.state.containers > 1) {
            this.setState( {containers: this.state.containers-1})
            const list = this.state.container
            list.pop()
            this.setState({ container: list })
        }
    }
    buttonAddY() {
        if(this.state.containersYaml < 20) {
            this.setState({ containersYaml: this.state.containersYaml+1 })
            const list = [...this.state.containerYAML, ""]
            this.setState({ containerYAML: list})
        }
    }
    buttonSubY() {
        if(this.state.containersYaml > 1) {
            this.setState( {containersYaml: this.state.containersYaml-1})
            const list = this.state.containerYAML
            list.pop()
            this.setState({ containerYAML: list })
        }
    }

    buttonAddV() {
        if(this.state.volumes < 5) {
            this.setState({ volumes: this.state.volumes+1 })
            const list = [...this.state.volume, ""]
            this.setState({ volume: list})
        }
    }
    buttonSubV() {
        if(this.state.volumes > 1) {
            this.setState( {volumes: this.state.volumes-1})
            const list = this.state.volume
            list.pop()
            this.setState({ volume: list })
        }
    }

    containerUpdate(idx, val){
        const list = this.state.container
        list[idx] = val
        this.setState({ container: list })
    }
    containerUpdateYAML(idx, val){
        const list = this.state.containerYAML
        list[idx] = val
        this.setState({ containerYAML: list })
    }

    volumeUpdate(idx, val){
        const list = this.state.volume
        list[idx] = val
        this.setState( {volume: list} )
    }

    getOpts(){
	var i
	var list = []
	for (i = 0; i < this.state.testbedData.length; ++i) {
		list.push({label: this.state.testbedData[i].name})
	}
        return list;
    }

    containerInput() {
        const divStyle = {marginTop: "10px"}
        const btn_add =  <button type="button" class="btn-primary" style={{width: "30px", margin: "5px"}} onClick={ () => this.buttonAdd()}> + </button>
        const btn_sub =  <button type="button" class="btn-primary" style={{width: "30px", margin: "5px"}} onClick={ () => this.buttonSub()}> - </button>

        const formInp = []
        var i;
        for (i = 0; i< this.state.containers; i++){
            const idx = i
            formInp.push(<Form.Control style={{margin: "5px"}} type="text" placeholder="Enter Dockerhub Repository Name" onChange={e => this.containerUpdate(idx, e.target.value)}/>
            )
        }

        return (
            <div style={divStyle}>
            {formInp}
            {btn_add}
            {btn_sub}
	    </div>
        )
    }

  containerInputYAML() {
        const divStyle = {marginTop: "10px"}
        const btn_add =  <button type="button" class="btn-primary" style={{width: "30px", margin: "5px"}} onClick={ () => this.buttonAddY()}> + </button>
        const btn_sub =  <button type="button" class="btn-primary" style={{width: "30px", margin: "5px"}} onClick={ () => this.buttonSubY()}> - </button>

        const formInp = []
        var i;
        for (i = 0; i< this.state.containersYaml; i++){
            const idx = i
            formInp.push(<Form.Control style={{margin: "5px"}} as="textarea" rows={5} placeholder="Enter Container YAML" onChange={e => this.containerUpdateYAML(idx, e.target.value)}/>
            )
        }

        return (
            <div style={divStyle}>
            {formInp}
            {btn_add}
            {btn_sub}
	    </div>
        )
    }

    selectTB(e){
	this.setState({ testbedSelect: e.label });
	console.log('testbedSelect Currently');
        console.log(this.state.testbedSelect);
	console.log(e.label);
	console.log(e);
	this.fetchTBRes(e.label);
    }

    updateHardware(i, checked) {
	var newHardware = this.state.hardware
	newHardware[i] = checked
	this.setState({hardware: newHardware})
    }

    getHardware(){

	var ret = []
	try{
		if(this.state.tbHardware.length > 0) {
			ret.push(<p>Specialized Hardware</p>)
		}

		for(var i = 0; i<this.state.tbHardware.length; ++i){
			var name = this.state.tbHardware[i]
			ret.push(<Form.Check inline label= {name} type={'checkbox'} id={'inline-${type}-3'} onChange={e => this.updateHardware(i, e.target.checked)}/>)
		}
	} catch(exception) {
		console.log('error rendering hardware buttons')
	}

	return (
		<div>
		{ret}
		</div>
     	)
    }

    updateSensors(i, checked) {
	var newSensors = this.state.sensors
	newSensors[i] = checked
	this.setState({sensors: newSensors})
    }

    getCPUandRAM() {

	var ret = []

	if(this.state.tbRam > 0){
		ret.push(<p>RAM: {this.state.ram}GB</p>)
		var max = this.state.tbRam.toString();
		ret.push(
		<div>
		<input
      		id="typeinp"
      		type="range"
      		min="1" max={max}
		value={"1"}
      		value={this.state.ram}
      		onChange={e => this.setState({ram: e.target.value})}
      		step="1"/>
		</div>
		)
	}

	if(this.state.tbCpu > 0){
		ret.push(<p>CPUs: {this.state.cpu}</p>)
		var max = this.state.tbCpu.toString();
		ret.push(
		<div>
		<input
      		id="typeinp"
      		type="range"
      		min="0.5" max={max}
		defaultValue={"0.5"}
      		value={this.state.cpu}
      		onChange={e => this.setState({cpu: e.target.value})}
      		step="0.5"/>
		</div>
		)
	}



	return (
		<div>
		{ret}
		</div>
	)
    }

    getSensors(){

	var ret = []
	try{
		if(this.state.tbSensors.length > 0)
			ret.push(<p>Sensors</p>)

		for(var i = 0; i<this.state.tbSensors.length; ++i){
			var name = this.state.tbSensors[i]
			ret.push(<Form.Check inline label= {name} type={'checkbox'} id={'inline-${type}-3'} onChange={e => this.updateSensors(i, e.target.checked)}/>)
		}
	} catch(exception) {
		console.log('error rendering sensor buttons')
	}

	return (
		<div>
		{ret}
		</div>
     	)
    }
    volumeInput(){
        const divStyle = {marginTop: "10px"}
        const btn_add =  <button type="button" class="btn-primary" style={{width: "30px", margin: "5px"}} onClick={ () => this.buttonAddV()}> + </button>
        const btn_sub =  <button type="button" class="btn-primary" style={{width: "30px", margin: "5px"}} onClick={ () => this.buttonSubV()}> - </button>

        const formInp = []
        var i;
        for (i = 0; i< this.state.volumes; i++){
            const idx = i
            formInp.push(<Form.Control style={{margin: "5px"}} type="text" placeholder="Enter Volume Name" onChange={e => this.volumeUpdate(idx, e.target.value)}/>
            )
        }

        return (
            <div style={divStyle}>
            {formInp}
            {btn_add}
            {btn_sub}
            </div>
        )

    }

    render() {
	return (
            <div>
                <Navbar className="color-nav" expand='xl'>
                  <Navbar.Brand href="#home">Pomerene Lab IoT Testbed Experiment Scheduler</Navbar.Brand>
                  <Navbar.Toggle aria-controls="basic-navbar-nav" />
                  <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="mr-auto">
                      <Nav.Link href="/">Schedule a New Experiment</Nav.Link>
                      <Nav.Link href="/delete">View My Scheduled Experiments</Nav.Link>
                    </Nav>
                 </Navbar.Collapse>
                </Navbar>
                <div class="container">
                <div>
                    <h1>Schedule a New Experiment</h1>
                </div>
                <br/>

		<div class="row">
                <div class="col-md">
			<p>Testbed Node</p>
			<Select options={ this.getOpts() } onChange={e => this.selectTB(e)} />
			<br/>

		</div>
                </div>

                <div class="row">
                <div class="col-md">
                    <p>Start Date</p>
                    <SingleDatePicker
                    date={this.state.startdate}
                    onDateChange={(startdate) => this.setState( {startdate})}
                    focused={this.state.focused}
                    onFocusChange={({focused}) => this.setState({focused})}
                    id="startdate"/>
                </div>
                <div class="col-md">
                    <p>End Date</p>
                    <SingleDatePicker
                    date={this.state.enddate}
                    onDateChange={(enddate) => this.setState( {enddate})}
                    focused={this.state.focusedEnd}
                    onFocusChange={({focused: focusedEnd}) => this.setState({focusedEnd})}
                    id="enddate"/>
                </div>
                </div>

                <div class="row">
                <div class="col-md">
                <p>Start Time</p>
                <TimePicker defaultValue={moment('00:00:00', 'HH:mm:ss')} size="large" onChange={(e) => this.handleChange(e,'starttime')}/>
                </div>
                <div class="col-md">
                <p>End time</p>
                <TimePicker defaultValue={moment('00:00:00', 'HH:mm:ss')} size="large" onChange={(e) => this.handleChange(e,'endtime')}/>
                </div>
                </div>
                <div>

                <Form onSubmit={this.handleSubmit}>
                <p> Experiment Container(s) </p>
		{this.containerInput()}

		<p> Experiment Container(s) YAML </p>
		{this.containerInputYAML()}

                <p> Shared Volumes (Optional) </p>
		{this.volumeInput()}

                <Form.Group controlId="textarea">

                <Form.Label>Experiment Description</Form.Label>
                <Form.Control as="textarea" rows={3} onChange={e => this.setState({ expdescription: e.target.value })}/>
                </Form.Group>

		{ this.getCPUandRAM() }

		{ this.getSensors() }

		{ this.getHardware() }

                <Button variant="primary" type="submit">
                    Submit
                </Button>
                </Form>
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
 export default App;
