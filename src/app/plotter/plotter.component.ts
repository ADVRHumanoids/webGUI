import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as Chart from 'chart.js';
import { Observable, Subject } from 'rxjs/Rx';
import { RobotStateService } from './../services/robot-state.service';

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
  private robotService: RobotStateService;
  private samples: number;
  private delete: boolean;
  private isfrozen: boolean;
  private map: Map<string, number>;
  private chartColors = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)'
  };

  constructor(robotService: RobotStateService) {
    this.robotService = robotService;
    this.isfrozen = false;
    this.samples = 500;
    this.data = {
      labels: [],
      datasets: []
    };
    this.map = new Map<string, number> ();

    setInterval(()=>{ 
      if (this.isfrozen)return;
      if(this.data.labels.length > this.samples)
        this.data.labels.splice(0, 1);
        for (let d of this.data.datasets){
          if(d.data.length > this.samples)
            d.data.splice(0, 1);
        }
      
    },10);
    
  } 
    
  ngAfterViewInit() {

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

    this.robotService.currentPlotAddDatamsg.subscribe(msg => {		
      
      if(msg == null)return;
      if (this.isfrozen)return;
      this.data.labels.push(new Date().getTime());
      for (let pdata of msg){
        var name = pdata["name"];
        if(name == null) return;
        var i = this.map.get(name);
        var value = pdata["value"];
        value = Math.round(value * 100) / 100;
        //console.log("ACCESS TO pos "+ i +" value "+value);
        this.addDataToDataset(this.data.datasets[i],value);
      }
    });

    this.robotService.currentPlotAddmsg.subscribe(msg => {	
      if(msg == null)return;
      var topic = msg["topic"];
      if( topic == null) return;
      var id = msg["id"];
      var name = msg["name"];
      this.addDataset(name+"/"+topic);
      var i = this.data.datasets.length -1;
      this.map.set(id,i);
      //console.log("ADD plot at "+ "pos "+i+" name "+name);
    });
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
    this.robotService.clearPlot();
    this.myChart.update();
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

    this.data.labels = [];
    for (let d of this.data.datasets)
        d.data = [];

    this.data.datasets.push(data);
    this.myChart.update();
  }

  addDataToDataset(dataset, value){

    dataset.data.push(value);
    //console.log("label "+ dataset.label+ " "+dataset.data.length);
    this.myChart.update();
  }

}
