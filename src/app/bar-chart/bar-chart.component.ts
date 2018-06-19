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

import { Component, OnInit, AfterViewInit, Input, OnDestroy } from '@angular/core';
import * as Chart from 'chart.js';
import { Observable, Subject, BehaviorSubject} from 'rxjs';
import { Subscription} from 'rxjs';
import { RobotStateService } from './../services/robot-state.service';

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css']
})
export class BarChartComponent implements OnInit,AfterViewInit, OnDestroy {

  @Input() idPlot: string;
  @Input() label: string;

  canvas: any;
  ctx: any;
  private data : any;
  private myChart: any;
  private isResponsive: boolean;
  private robotService: RobotStateService;
  private map: Map<string, number>;
  private subPlotAddDatamsg : Subscription;
  private subPlotAddmsg : Subscription;
  private subPlotClearmsg : Subscription;
  public topics = [];

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
    if( this.label == null) this.label = "Plotter";
    this.data = {
      labels: [],
      datasets: []
    };
    
  }

  setTopic(topic){
    this.robotService.currentTopicBar = topic;
  }

  getId(){
    return "myBarChart"+this.idPlot;
  }

  ngOnInit() {
    console.log("ID ONINIT "+this.getId());
  }

  ngOnDestroy() {

    this.subPlotAddDatamsg.unsubscribe();
    //this.subPlotAddmsg.unsubscribe();
    //this.subPlotClearmsg.unsubscribe();
    this.robotService = null;
    this.map = null;
     //REMOVE HOSTLISTENER
     //REMOVE SETINTERVAL
   }

  ngAfterViewInit() {

    setTimeout(()=>{ 
      console.log("CHART ID "+this.idPlot);
      this.isResponsive = true;
      this.canvas = document.getElementById(this.getId());
      this.ctx = this.canvas.getContext('2d');
      this.myChart = new Chart(this.ctx, {
        type: 'bar',
        data: this.data,
        options: {
          events: ['click'],
          responsiveAnimationDuration:0,
          animation:{
            duration: 0
          },
          responsive: this.isResponsive,
          maintainAspectRatio: false,
          //cubicInterpolationMode: "",
          title: {
            display: true,
            text: this.label
          },
          tooltips: {
            enabled: true,
            mode: 'index',
            intersect: true,
            callbacks: {
              afterLabel: (tooltipItem, data)=>{ 
                this.robotService.selectJointSensorName = tooltipItem.xLabel;
                this.robotService.advertiseSelectedJoint(this.robotService.selectJointSensorName);
                return "";
              }
            }
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
                labelString: 'Joints'
              }
            }],
            yAxes: [{
              display: true,
              ticks: {
                //stepSize: 0.5
                beginAtZero: true,
              },
              scaleLabel: {
                display: true,
                //labelString: 'Value'
              }
            }]
          }
        }
      });
  
      this.robotService.registerBarChartComponent(parseInt(this.idPlot));
      this.subPlotAddDatamsg = this.robotService.currentBarAddDatamsg.get(parseInt(this.idPlot)).subscribe(msg => {		
        
        if(msg == null)return;
        if (msg != null){
          //console.log(msg);
          var topicname = msg["topic"];
          var robot = msg["robot"];
          if(robot == null) return;
          //console.log(robot);
          var joint = robot["joint_name"];
          var topic = robot[topicname];
    
          var keys =  Object.keys(robot);
          this.topics = keys;

          this.addDataset(joint);
          this.setLabel(topicname);
          this.addDataToDataset(topic);
        }

      });

    },100);
    
  }

  clearData(){
    this.data.labels = [];
    this.data.datasets = [];
    this.robotService.clearPlot(parseInt(this.idPlot));
    this.myChart.update();
  }

  addDataset(msg){

    if( this.data.labels!= null && this.data.labels.length == 0){
      var ol = Object.keys(this.chartColors);
      var colorName = ol[this.data.datasets.length % ol.length];
      var data = {
        label: "",
        backgroundColor: this.chartColors[colorName],
        borderColor: this.chartColors[colorName],
        borderWidth: 1,
        data: new Array(msg.length)}; //msg["value"]
      this.data.labels = msg;
      this.data.datasets.push(data);
    }
  }

  setLabel(label){
    this.data.datasets[0].label = label;
  }

  setScale(val){
    this.myChart.options.scales.yAxes[0].ticks.stepSize = val;
  }

  addDataToDataset(msg){

    for (let i = 0; i < this.data.labels.length; i++) {
      this.data.datasets[0].data[i] = msg[i];
    }
    this.myChart.update(0);
  }
}
