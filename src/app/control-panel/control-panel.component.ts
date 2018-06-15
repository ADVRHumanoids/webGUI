import { Component, OnInit } from '@angular/core';
import { RobotStateService } from './../services/robot-state.service';
import { Observable, Subject } from 'rxjs';

@Component({
  selector: 'app-control-panel',
  templateUrl: './control-panel.component.html',
  styleUrls: ['./control-panel.component.css']
})
export class ControlPanelComponent implements OnInit {

  private robotState = {
    name: "",
    id: 0,
    motorPos: 0,
    linkPos: 0,
    motorVel: 0,
    linkVel: 0,
    temp: 0,
    effort: 0,
    stiff: 0,
    damp: 0,
    fault: 0,
    aux : 0,
    refPos: 0,
    refVel: 0,
    refTor: 0
  }

  private robotSensorState = {
    name: "",
    id: 0,
    forcex: 0,
    forcey: 0,
    forcez: 0,
    torquex: 0,
    torquey: 0,
    torquez: 0,
  }

  public isJoint = true;
  private robotService: RobotStateService;
  private robot: Map<string, any>;
  private robotSensor: Map<string, any>;

  constructor(robotService: RobotStateService) { 
    this.robotService = robotService;
    this.robot = new Map<string, any>();
    this.robotSensor = new Map<string, any>();
    this.robotService.currentmsg.subscribe(msg => {	
      this.robot = msg["robot"];
      this.robotSensor = msg["sensor"];
      if(this.robot != null && this.robotService.isJoint){
        var item = this.robot.get(this.robotService.selectJointSensorName);
        if (item != null){
          this.robotState = item;
          this.isJoint = true;
        }
      }

      if (this.robotSensor!= null && !this.robotService.isJoint){
          var items = this.robotSensor.get(this.robotService.selectJointSensorName);
          if (items != null){
            this.robotSensorState = items;
            this.isJoint = false;
          }
      }
    });
  }

  ngOnInit() {
  }

  addPlot(id, topic, name){
    this.robotService.addPlot(0,id,topic,name);
  }

  plotState(id, name){
    this.robotService.plotState(id,name);
  }
}
