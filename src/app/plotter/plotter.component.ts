import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as Chart from 'chart.js';
import { Observable, Subject } from 'rxjs/Rx';
import { WebsocketService } from './../services/websocket.service';

var WS_URL;

@Component({
  selector: 'app-plotter',
  templateUrl: './plotter.component.html',
  styleUrls: ['./plotter.component.css']
})

export class PlotterComponent implements AfterViewInit{

  canvas: any;
  ctx: any;
  private data : any;
  private myChart: any;
  private wsService: WebsocketService;
  private samples: number;
  private delete: boolean;
  private isfrozen: boolean;
  private chartColors = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)'
  };

  sendMsg() {
    this.wsService.messages.next({"msg":"Send"});
  }

  parseMsg(msg){
    
      var robot = msg["Robot"];
      if (robot != null){
        var nameList = robot["joint_name"];
        var ids = robot["joint_id"];
        var motors = robot["motor_position"];
        var links = robot["link_position"];
        var motorsv = robot["motor_velocity"];
        var linksv = robot["link_velocity"];
        var temps = robot["temperature"];
        var efforts = robot["effort"];
        var stiffs = robot["stiffness"];
        var damps = robot["damping"];
        var faults = robot["fault"];
        var auxs = robot["aux"];
        
        var val = Math.round(motors[15] * 100) / 100;
        this.addDataToDataset(this.data.datasets[0],val,new Date().getTime());

      }
  }

  constructor(wsService: WebsocketService) {
    this.wsService = wsService;
    this.delete = false;
    this.isfrozen = false;
    this.samples = 600;
    var ip = window.location.origin;
    ip = ip.substr(7);
    WS_URL = "ws://"+ip+"/websocket";
    this.wsService.connect(WS_URL);
    this.wsService.messages.subscribe(msg => {		
     
      this.parseMsg(msg);
      this.sendMsg();
    });

    setInterval(()=>{ 
      this.delete = true;
    },10);
    
  } 
    
  ngAfterViewInit() {

    this.data = {
      labels: [],
      datasets: []
    };
    this.canvas = document.getElementById('myChart');
    this.ctx = this.canvas.getContext('2d');
    this.myChart = new Chart(this.ctx, {
      type: 'line',
      data: this.data,
      options: {
        responsive: false,
        steppedLine: true,
        //cubicInterpolationMode: "",
				title: {
					display: true,
					text: 'Plotter'
				},
				tooltips: {
          enabled: false,
					mode: 'index',
					intersect: false,
				},
				/*hover: {
					mode: 'nearest',
					intersect: true
				},*/
				scales: {
					xAxes: [{
						display: false,
						scaleLabel: {
							display: true,
							//labelString: 'Time'
						}
					}],
					yAxes: [{
            beginAtZero: true,
            display: true,
            ticks: {
              stepSize: 0.5
            },
						scaleLabel: {
              display: true,
							//labelString: 'Value'
						}
					}]
				}
			}
    });

    this.addDataset("test");
  }

  setScale(val){

    this.myChart.options.scales.yAxes[0].ticks.stepSize = val;
  }

  freeze(){

    this.isfrozen = !this.isfrozen;
    this.myChart.options.tooltips.enabled = this.isfrozen;
  }

  clearData(){

    this.data.labels = [];
    this.data.datasets = [];
  }

  addDataset(label){

    var ol = Object.keys(this.chartColors);
    var colorName = ol[this.data.datasets.length % ol.length];
    var data = {
      label: label,
      backgroundColor: this.chartColors[colorName],
      borderColor: this.chartColors[colorName],
      pointStyle: 'line',
      data: [],
      fill: false};

    this.data.datasets.push(data);
    this.myChart.update();
  }

  addDataToDataset(dataset, value, label){

      if (this.isfrozen)return;
      dataset.data.push(value);
      this.data.labels.push(label);

      if( this.delete && dataset.data.length > this.samples){
        dataset.data.splice(0, 5);
        this.data.labels.splice(0, 5);
        //console.log(dataset.data.length);
        this.delete = false;
      }
      this.myChart.update();
    }

}
