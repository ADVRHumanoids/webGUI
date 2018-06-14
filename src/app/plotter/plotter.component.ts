/*
 * Copyright (C) 2017 IIT-ADVR
 * Author:  Giuseppe Rigano
 * email:   giuseppe.rigano@iit.it
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>
*/

import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import * as Chart from 'chart.js';
import { Observable, Subject } from 'rxjs';
import { RobotStateService } from './../services/robot-state.service';

var WS_URL;

@Component({
  selector: 'app-plotter',
  templateUrl: './plotter.component.html',
  styleUrls: ['./plotter.component.css']
})

export class PlotterComponent implements AfterViewInit{

  @Input() idPlot: string;
  @Input() label: string;
  @Input() fields: Array<string>;

  canvas: any;
  ctx: any;
  private data : any;
  private myChart: any;
  private isResponsive: boolean;
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
    this.samples = 100;
    if( this.label == null) this.label = "Plotter";
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

  getId(){
    return "myChart"+this.idPlot;
  }

  ngAfterViewInit() {

    console.log("PLOTTER ID "+this.idPlot);
    //if( parseInt(this.idPlot) == 1) 
    //  this.isResponsive = false;
    //else 
    this.isResponsive = true;
    this.canvas = document.getElementById(this.getId());
    this.ctx = this.canvas.getContext('2d');
    this.myChart = new Chart(this.ctx, {
      type: 'line',
      data: this.data,
      options: {
        responsiveAnimationDuration:0,
        elements:{
          line:{
            tension: 0
          }
        },
        animation:{
          duration: 0
        },
        responsive: this.isResponsive,
        maintainAspectRation: false,
        steppedLine: true,
        //cubicInterpolationMode: "",
				title: {
					display: true,
					text: this.label
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
        ticks:{
          source: 'labels'
        },
				scales: {
					xAxes: [{
            display: false,
            type: 'time',
            distribution: 'series',
            time:{
              unit: 'second',
              displayFormats:{
                second: 'ss'
              }
            },
						scaleLabel: {
							display: false,
							labelString: 'Time'
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

    this.robotService.registerPlotterComponent(parseInt(this.idPlot), this.fields);
    this.robotService.currentPlotAddDatamsg.get(parseInt(this.idPlot)).subscribe(msg => {		
      
      if(msg == null)return;
      if (this.isfrozen)return;
      this.data.labels.push(new Date());
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

    this.robotService.currentPlotAddmsg.get(parseInt(this.idPlot)).subscribe(msg => {	
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

    this.robotService.currentClearmsg.get(parseInt(this.idPlot)).subscribe(msg => {	
      if(msg == null)return;
      this.clearData();
    });
  }

  setScale(val){

    this.myChart.options.scales.yAxes[0].ticks.stepSize = val;
  }

  setSample(val){
    
    this.samples = val;
  }

  freeze(){

    this.isfrozen = !this.isfrozen;
    this.myChart.options.tooltips.enabled = this.isfrozen;
  }

  clearData(){

    this.data.labels = [];
    this.data.datasets = [];
    this.robotService.clearPlot(parseInt(this.idPlot));
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
