import { Component, OnInit, OnDestroy } from '@angular/core';
import { RobotStateService } from './../services/robot-state.service';
import { Observable, Subject, Subscription } from 'rxjs';
import { AppError } from './../common/app-error';
import { NotFoundError } from './../common/not-foud-error';
import { HttpClient } from '@angular/common/http';
import { HttpService } from './../services/http.service';

@Component({
  selector: 'app-control-panel',
  templateUrl: './control-panel.component.html',
  styleUrls: ['./control-panel.component.css']
})
export class ControlPanelComponent implements OnInit, OnDestroy {
  
  ngOnDestroy() {
    clearTimeout(this.timeout);
    this.sub.unsubscribe();
    this.sub1.unsubscribe();
    this.robot = null;
    this.robotService = null;
    this.robotSensor = null;
  }

  private sub : Subscription;
  private sub1 : Subscription;
  private timeout;

  public type = "range";
  private service;

  private pval = 0.0;
  private vval = 0.0;
  private eval = 0.0;
  private sval = 0.0;
  private dval = 0.0;

  public limit = {
    poslim : { llim: 0, ulim:0}, 
    efflim: { llim: 0, ulim:0},
    vellim: { llim: 0, ulim:0}
  }

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
    fault: "",
    aux : 0,
    refPos: 0,
    refVel: 0,
    refTor: 0
  }

  private robotSensorFTState = {
    name: "",
    id: 0,
    forcex: 0,
    forcey: 0,
    forcez: 0,
    torquex: 0,
    torquey: 0,
    torquez: 0,
  }

  private robotSensorIMUState = {
    name: "",
    id: 0,
    ang_velx: 0,
    ang_vely: 0,
    ang_velz: 0,
    lin_accx: 0,
    lin_accy: 0,
    lin_accz: 0,
    orientationx: 0,
    orientationy: 0,
    orientationz: 0,
    orientationw: 0
  }

  public isJoint = true;
  public sensorType = "";
  private robotService: RobotStateService;
  private robot: Map<string, any>;
  private robotSensor: Map<string, any>;
  private isControlEnable = false;

  roundValue(item){
    
    for( var key of Object.keys(item)){
      if(typeof item[key] == "string") continue;
      item[key] = Math.round(item[key] * 100) / 100
    }
  }

  constructor(robotService: RobotStateService, http: HttpClient) { 
    this.robotService = robotService;
    this.robot = new Map<string, any>();
    this.robotSensor = new Map<string, any>();
    this.service = new HttpService(http);
    this.service.setURL("/singlejoint");

    this.sub1 = this.robotService.currentJointmsg.subscribe(msg => {	
      this.setControl();
    });

    this.sub = this.robotService.currentmsg.subscribe(msg => {	
      this.robot = msg["robot"];
      this.robotSensor = msg["sensor"];
      if(this.robot != null && this.robotService.isJoint){
        var item = this.robot.get(this.robotService.selectJointSensorName);
        if (item != null){
          this.robotState = item;
          this.roundValue(this.robotState);
          this.isJoint = true;
          var limit = this.robotService.limits.get(this.robotService.selectJointSensorName);
          if (limit != null)
            this.limit = limit;
        }
      }

      if (this.robotSensor!= null && !this.robotService.isJoint){
          var items = this.robotSensor.get(this.robotService.selectJointSensorName);
          if (items != null){
            this.sensorType = items.type;
            if (items.type == "ft"){
              this.robotSensorFTState = items;
              this.roundValue(this.robotSensorFTState);
            }
            else if (items.type == "imu"){
              this.robotSensorIMUState = items;
              this.roundValue(this.robotSensorIMUState);
            }
            this.isJoint = false;
          }
      }
    });
  }

  ngOnInit() {

    /*this.service.get("/chains")
    .subscribe(
      response => {
         for (let o of response["Chains"]){
           let p =o["Val"];
           let chna =o["Chain"];
            for (let u of p){
              this.chains.set(u["ID"],{ Chain: chna, Val:{ Name :u["Name"] , Id: u["ID"], JVal: u["Lval"],
              VVal: u["Vval"], EVal: u["Eval"], SVal: u["Sval"], DVal: u["Dval"], PRef: u["pos_ref"],
              VRef: u["vel_ref"], ERef: u["eff_ref"], Llimit: u["Llimit"], Ulimit: u["Ulimit"] } });
            }
        }
      },
      (error: AppError) => {

        //rimovo dal vettore
        
        if (error instanceof NotFoundError){
          //expected error
          //deleted
          //this.form.setErrors(error.json());
        }
        else{
          //unexpected error
          throw error;

        }
        
       });*/
  }

  addPlot(id, topic, name){
    this.robotService.changeView("Plotter");
    this.timeout = setTimeout(()=>{ 
      this.robotService.addPlot(0,id,topic,name);
    },200);    
  }

  advertisePosition(name,value){
    var msg ={ "name":name, "value": value };
    this.robotService.advertiseCtrlSelectedJoint(msg);
  }

  setPosRef(param: number){

    this.pval = param;

  }

  setVelRef(param: number){
    
   this.vval = param;
    
  }

  setEffortRef(param: number){
    
   this.eval = param;
    
  }

  setStiffRef(param: number){
    
    this.sval = param;
    
  }

  setDampRef(param: number){
    
    this.dval = param;
    
  }

  sendVal(id:number){

    //{"joint":[{"id": 15, "val": 0},{"id": 16, "val": 0}]}
    this.service.create({"joint":[{"id": Number(this.robotState.id), "pos": Number(this.pval),
    "vel": Number(this.vval),  "eff": Number(this.eval),  "stiff": Number(this.sval),
    "damp": Number(this.dval) }]})
    .subscribe(
      response => {
        
      },
      (error: AppError) => {

        //rimovo dal vettore
        
        if (error instanceof NotFoundError){
          //expected error
          //deleted
          //this.form.setErrors(error.json());
        }
        else{
          //unexpected error
          throw error;

        }
        
       });

  }

  setControl(){
    
    if(this.isControlEnable){
      this.pval = this.robotState.refPos;
      this.vval = this.robotState.refVel;
      this.eval = this.robotState.refTor;
      this.sval = this.robotState.stiff;
      this.dval = this.robotState.damp;
    }else {
      this.advertisePosition(null,0);
    }
  }
}
