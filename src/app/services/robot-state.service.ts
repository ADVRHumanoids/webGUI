import { Injectable } from '@angular/core';
import * as Rx from 'rxjs/Rx';
import { Observable, Subject } from 'rxjs/Rx';
import { WebsocketService } from './websocket.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Injectable()
export class RobotStateService {

  private messages: Subject<any>;
  private robot: Map<string, any>;
  private robotSensor: Map<string, any>;
  private parsedMsg = new BehaviorSubject<any>({});
  currentmsg = this.parsedMsg.asObservable();
  private plotMap = new Map<string,string>();
  private plotArray = new Array<any>();
  private plotAddMsg = new BehaviorSubject<any>({});
  currentPlotAddmsg = this.plotAddMsg.asObservable();
  private plotAddDataMsg = new BehaviorSubject<any>({});
  currentPlotAddDatamsg = this.plotAddDataMsg.asObservable();

  constructor(private wsService: WebsocketService) { 

    this.robot = new Map<string, any>();
    this.robotSensor = new Map<string, any>();
    var ip = window.location.origin;
    ip = ip.substr(7);
    var WS_URL = "ws://"+ip+"/websocket";
    this.wsService.connect(WS_URL);
    this.wsService.messages.subscribe(msg => {		
      this.parseMsg(msg);
      this.sendMsg();
     });

  }
  
  publishMsg(msg){
    this.parsedMsg.next(msg);
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

      for (let i = 0; i < nameList.length ; i++) {
        var obj = {
          name: nameList[i],
          id: ids[i],
          motorPos: motors[i],
          linkPos: links[i],
          motorVel: motorsv[i],
          linkVel: linksv[i],
          temp: temps[i],
          effort: efforts[i],
          stiff: stiffs[i],
          damp: damps[i],
          fault: faults[i],
          aux: auxs[i]
        };
        this.robot.set(nameList[i], obj);
        
        var keys =  Object.keys(obj);
        for (let key of keys){
          var topic = this.plotMap.get(ids[i]+"/"+key);
          if (topic != null){
            var pobj = {"name": ids[i]+"/"+key , "value": obj[topic]};
            this.plotArray.push(pobj);
          }
        }
        
         

        //var plotId = ids[i] +"/"+ 
        //this.plotMap.get()
       
        //push to vector
        //publish out
        //this.plotAddDataMsg.next(obj);
        /*var angle = motorList[i];
        var joint = this.jointmap.get(nameList[i]);
        var userdata = joint.userData;
        if (userdata != null){
          var axis = userdata["axis"];
          var isloaded = joint.children[0].userData["load"];
          if (isloaded && axis != null){
            // console.log("SET ROT "+nameList[i]+ " axis "+ axis+ " angle "+angle);
            //joint.setRotationFromAxisAngle(new THREE.Vector3(axis[0],axis[1],axis[2]),angle);
            //joint.rotateOnAxis(new THREE.Vector3(axis[0],axis[1],axis[2]),angle);
          }
        }*/
       
      }

    }
    var sensors = msg["Sensors"];
    if (sensors != null){
      var nameList = sensors["ft_name"];
      var ids = sensors["ft_id"];
      var forces = sensors["force"];
      var torques = sensors["torque"];
      var forcesv = [0,0,0];
      var torquesv = [0,0,0];
      for (let i = 0; i < nameList.length ; i++) {
        if(forces != null)
          forcesv = forces[i]["Vector"];
        if(forces != null)
          torquesv = torques[i]["Vector"];
        var objs = {
          name: nameList[i],
          id: ids[i],
          forcex: forcesv[0],
          forcey: forcesv[1],
          forcez: forcesv[2],
          torquex: torquesv[0],
          torquey: torquesv[1],
          torquez: torquesv[2]
        };
        this.robotSensor.set(nameList[i], objs);
        var keys =  Object.keys(objs);
        for (let key of keys){
          var topic = this.plotMap.get(ids[i]+"/"+key);
          if (topic != null){
            var pobj = {"name": ids[i]+"/"+key , "value": objs[topic]};
            this.plotArray.push(pobj);
          }
        }
      }
    }
    this.publishMsg({"robot":this.robot,"sensor":this.robotSensor});
    if(this.plotArray.length != 0 ){
      this.plotAddDataMsg.next(this.plotArray);
      this.plotArray = [];
    }
  }

  sendMsg() {
    this.wsService.messages.next({"msg":"Send"});
  }
  
  addPlot(id, topic, name){
    if ( this.plotMap.get(id +"/"+ topic) != null) return;
    var obj = {"topic": topic, "id": id +"/"+ topic, "name": name};
    this.plotMap.set(id +"/"+ topic,topic);
    this.plotAddMsg.next(obj);
  }

  clearPlot(){
    this.plotMap.clear();
    this.plotArray = [];
  }

}
