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

import { Injectable } from '@angular/core';
import * as Rx from 'rxjs';
import { Observable, Subject, Subscription } from 'rxjs';
import { WebsocketService } from './websocket.service';
import {BehaviorSubject} from 'rxjs';
import {MatSnackBar} from '@angular/material';
import { OnDestroy } from '@angular/core';

@Injectable()
export class RobotStateService implements OnDestroy {

  private messages: Subject<any>;
  private robot: Map<string, any>;
  private robotSensor: Map<string, any>;
  private parsedMsg = new BehaviorSubject<any>({});
  currentmsg = this.parsedMsg.asObservable();
  private plotMap = new Map<number, Map<string,string> >();
  private plotArrayMap = new Map<number, Array<any> >();
  private topicPlotMap = new Map<number, Array<string> >();

  private plotAddMsg = new Map<number, BehaviorSubject<any> >();
  public currentPlotAddmsg = new Map<number,Observable<any> >();
  private plotAddDataMsg = new Map<number, BehaviorSubject<any> >();
  public currentPlotAddDatamsg = new Map<number,Observable<any> >();
  private plotClearMsg = new Map<number, BehaviorSubject<any> >();
  public currentClearmsg = new Map<number,Observable<any> >();
  public selectJointSensorName = "";
  public selectJointSensorId = 0;
  private timeout;
  public isJoint = true;
  private JointMsg = new BehaviorSubject<any>({});
  public currentJointmsg = new Observable<any>();
  private CtrlJointMsg = new BehaviorSubject<any>({});
  public CtrlcurrentJointmsg = new Observable<any>();
  private barAddDataMsg = new Map<number, BehaviorSubject<any> >();
  public currentBarAddDatamsg = new Map<number,Observable<any> >();
  public currentTopicBar = "temperature";
  private connectionAttempt = 5;
  private sub : Subscription;
  public limits = new Map<string, any>();

  public modelViewFlag = true;
  public plotterViewFlag = false;
  public allPlotsViewFlag = false;
  public controlPanelViewFlag = false;
  public toggleModel = "Model";

  public CanvasState = {
    scene : null,
    camera : null,
    controls: null,
    linkMap: null,
    jointMap: null,
    renderer: null,
    state: 0
  };

  ngOnDestroy() {
    this.dispose();
  }

  dispose(){

    //console.log("DESTROY SERVICE");
    clearTimeout(this.timeout);
    if (this.sub != null) this.sub.unsubscribe();
    window.removeEventListener('unload', this.dispose);

  }

  public changeView(param){
    //console.log("enableModelView"+ param);
    if (param == "Model"){
      this.modelViewFlag = true;
      this.plotterViewFlag = false;
      this.allPlotsViewFlag = false;
    }
    else if (param == "Plotter"){
      this.plotterViewFlag = true;
      this.modelViewFlag = false;
      this.allPlotsViewFlag = false;
    }
    else if (param == "AllPlots"){
      this.plotterViewFlag = false;
      this.allPlotsViewFlag = true;
      this.modelViewFlag = false;
    }
    this.toggleModel = param;
  }

  onError(err){
    console.log("WebSocket Error occur ");
    console.log(err);
    this.snackBar.open("OFF-LINE",null,{
      duration: 3000});
    this.sub.unsubscribe();
    this.reconnect();
  }

  reconnect(){
    this.timeout = setTimeout(()=>{
      console.log("WebSocket reconnect attempt");
      this.connectWebSocket();     
    },5000);
  }

  onClose(){
    console.log("WebSocket closed by server");
    this.snackBar.open("OFF-LINE",null,{
      duration: 3000});
    this.sub.unsubscribe();
    this.reconnect();
  }

  connectWebSocket(){
    console.log("WebSocket trying connect");
    clearTimeout(this.timeout);
    var ip = window.location.origin;
    ip = ip.substr(7);
    var WS_URL = "ws://"+ip+"/websocket";
    this.wsService.connect(WS_URL);
    this.sub = this.wsService.messages.subscribe(msg => {		
      this.parseMsg(msg);
      this.sendMsg();
     },(err) => this.onError(err), () => this.onClose());
  }

  constructor(private wsService: WebsocketService, public snackBar: MatSnackBar) { 

    window.addEventListener('unload', this.dispose);
    this.robot = new Map<string, any>();
    this.robotSensor = new Map<string, any>();
    this.registerSelectedJoint();
    this.registerCtrlSelectedJoint();
    this.connectWebSocket();       
  }
  
  publishMsg(msg){
    this.parsedMsg.next(msg);
  }

  registerSelectedJoint(){
    this.currentJointmsg = this.JointMsg.asObservable();
  }

  registerCtrlSelectedJoint(){
    this.CtrlcurrentJointmsg = this.CtrlJointMsg.asObservable();
  }

  registerPlotterComponent(id, fields){

    this.plotAddDataMsg.set(id,new BehaviorSubject<any>({}));
    this.currentPlotAddDatamsg.set(id,this.plotAddDataMsg.get(id).asObservable());
 
    this.plotAddMsg.set(id,new BehaviorSubject<any>({}));
    this.currentPlotAddmsg.set(id,this.plotAddMsg.get(id).asObservable());

    this.plotClearMsg.set(id,new BehaviorSubject<any>({}));
    this.currentClearmsg.set(id,this.plotClearMsg.get(id).asObservable());

    if (fields != null)
      this.topicPlotMap.set(id,fields);
  }

  registerBarChartComponent(id){
    this.barAddDataMsg.set(id,new BehaviorSubject<any>({}));
    this.currentBarAddDatamsg.set(id,this.barAddDataMsg.get(id).asObservable());
  }

  getJointId(param){
    var obj = this.robot.get(param);
    if (obj == null) return null;
    return obj.id;
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
      var faults = <string>robot["fault_string"];
      var posrefs = robot["pos_ref"];
      var velrefs = robot["vel_ref"];
      var torrefs = robot["eff_ref"];
      var auxs = robot["aux"];

      //var barTopic = robot[this.currentTopicBar];
      //if (barTopic != null)
      if (this.currentBarAddDatamsg.get(0)!= null)
        this.barAddDataMsg.get(0).next({"robot":robot,"topic":this.currentTopicBar});
        
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
          aux: auxs[i],
          refPos: posrefs[i],
          refVel: velrefs[i],
          refTor: torrefs[i]
        };
        this.robot.set(nameList[i], obj);
        var keys =  Object.keys(obj);
        this.plotMap.forEach((value: Map<string,string>, mkey: number) => {
          //var plotItem = this.plotMap.get(1);
          if (value != null){
            for (let key of keys){
              var topic = value.get(ids[i]+"/"+key);
              if (topic != null){
                var pobj = {"name": ids[i]+"/"+key , "value": obj[topic]};
                var array = this.plotArrayMap.get(mkey);
                if( array != null)
                  array.push(pobj);
              }
            }
          }
        });
      }
    }
    var sensors = msg["Sensors"];
    if (sensors != null){
      var fts = sensors["fts"];
      var nameList = fts["ft_name"];
      var ids = fts["ft_id"];
      var forces = fts["force"];
      var torques = fts["torque"];
      var forcesv = [0,0,0];
      var torquesv = [0,0,0];
      for (let i = 0; i < nameList.length ; i++) {
        if(forces != null)
          forcesv = forces[i]["Vector"];
        if(torques != null)
          torquesv = torques[i]["Vector"];
        var objs = {
          type : "ft",
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
        this.plotMap.forEach((value: Map<string,string>, mkey: number) => {
          //var plotItem = this.plotMap.get(1);
          if (value != null){
            for (let key of keys){
              var topic = value.get(ids[i]+"/"+key);
              if (topic != null){
                var pobj = {"name": ids[i]+"/"+key , "value": objs[topic]};
                var array = this.plotArrayMap.get(mkey);
                if( array != null)
                  array.push(pobj);
              }
            }
          }
        });
      }
      //IMU
      var imus = sensors["imus"];
      var nameList = imus["imu_name"];
      var ids = imus["imu_id"];
      var ang_vel = imus["ang_vel"];
      var lin_acc = imus["lin_acc"];
      var orientation = imus["orientation"];
      var ang_velv = [0,0,0];
      var lin_accv = [0,0,0];
      var orientationv = [0,0,0,0];
      for (let i = 0; i < nameList.length ; i++) {
        if(ang_vel != null)
          ang_velv = ang_vel[i]["Vector"];
        if(lin_acc != null)
          lin_accv = lin_acc[i]["Vector"];
        if(orientation != null)
          orientationv = orientation[i]["Vector"];
        var objimu = {
          type : "imu",
          name: nameList[i],
          id: ids[i],
          ang_velx: ang_velv[0],
          ang_vely: ang_velv[1],
          ang_velz: ang_velv[2],
          lin_accx: lin_accv[0],
          lin_accy: lin_accv[1],
          lin_accz: lin_accv[2],
          orientationx: orientationv[0],
          orientationy: orientationv[1],
          orientationz: orientationv[2],
          orientationw: orientationv[3]
        };
        this.robotSensor.set(nameList[i], objimu);
        var keys =  Object.keys(objimu);
        this.plotMap.forEach((value: Map<string,string>, mkey: number) => {
          //var plotItem = this.plotMap.get(1);
          if (value != null){
            for (let key of keys){
              var topic = value.get(ids[i]+"/"+key);
              if (topic != null){
                var pobj = {"name": ids[i]+"/"+key , "value": objimu[topic]};
                var array = this.plotArrayMap.get(mkey);
                if( array != null)
                  array.push(pobj);
              }
            }
          }
        });
      }
    }
    this.publishMsg({"robot":this.robot,"sensor":this.robotSensor});
    this.plotArrayMap.forEach((value: any, key: number) => {
      if( value != null && value.length != 0 ){
        this.plotAddDataMsg.get(key).next(value);
        this.plotArrayMap.set(key,[]);
      }
    });
  }

  sendMsg() {
    this.wsService.messages.next({"msg":"Send"});
  }
  
  addPlot(idPlot,id, topic, name){
    var plotItem = this.plotMap.get(idPlot);
    if (plotItem != null)
    if ( plotItem.get(id +"/"+ topic) != null) return;

    var obj = {"topic": topic, "id": id +"/"+ topic, "name": name};
    if (plotItem == null){
      plotItem = new Map<string,string>();
      this.plotMap.set(idPlot,plotItem);
    }
    plotItem.set(id +"/"+ topic,topic);
    
    if (this.plotArrayMap.get(idPlot) == null)
      this.plotArrayMap.set(idPlot, new Array<any>());
    var addMsgItem = this.plotAddMsg.get(idPlot);
    addMsgItem.next(obj);
  }

  advertiseSelectedJoint(param){
    this.JointMsg.next(param);
  }

  advertiseCtrlSelectedJoint(param){
    this.CtrlJointMsg.next(param);
  }

  plotState(id, name){
    this.topicPlotMap.forEach((value: Array<string>, key: number) => {
      var clearItem = this.plotClearMsg.get(key);
      if(clearItem != null) clearItem.next({});
      for (let t of value){
        this.addPlot(key,id,t,name);
      }
    });
  }

  clearPlot(idPlot){
    var array = this.plotArrayMap.get(idPlot);
    var tmp = this.plotMap.get(idPlot)
    if (tmp!= null)
      tmp.clear();
    this.plotArrayMap.set(idPlot,[]);
  }

}
