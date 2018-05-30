import { NotFoundError } from './../common/not-foud-error';
import { AppError } from './../common/app-error';
import { HttpService } from './../services/http.service';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, NgModule } from '@angular/core';

@Component({
  selector: 'app-slider-control',
  templateUrl: './slider-control.component.html',
  styleUrls: ['./slider-control.component.css']
})
export class SliderControlComponent implements OnInit {

  private type = "range";
  private service;
  private chains = [];
  private jid = [];
  private jval = [];
  private evval = [];
  private vvval = [];
  private svval = [];
  private dvval = [];
  private posref = [];
  private velref = [];
  private effref = [];

  private pval = 0.0;
  private vval = 0.0;
  private eval = 0.0;
  private sval = 0.0;
  private dval = 0.0;

 constructor(http: HttpClient) { 
    
    this.service = new HttpService("/singlejoint",http);
  }

  ngOnInit() {

    this.service.get("/chains")
    .subscribe(
      response => {
         for (let o of response["Chains"]){
           let p =o["Val"];
           let chna =o["Chain"];
            for (let u of p){
              this.chains.push({ Chain: chna, Val:{ Name :u["Name"] , Id: u["ID"], JVal: u["Lval"],
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
        
       });
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
    this.service.create({"joint":[{"id": Number(id), "pos": Number(this.pval),
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


  onMaster(){

     this.service.get("/master?web")
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


       this.service.get("/state")
      .subscribe(
      response => {
        
        for (let o of response["joint_id"]){
          this.jid.push(o);
           
        }

        for (let o of response["link_position"]){
            this.jval.push(o);
        }

        for (let o of response["effort"]){
          this.evval.push(o);
        }

        for (let o of response["link_velocity"]){
          this.vvval.push(o);
        }

        for (let o of response["stiffness"]){
          this.svval.push(o);
        }

        for (let o of response["damping"]){
          this.dvval.push(o);
        }
        

        for (let o of response["pos_ref"]){
          this.posref.push(o);
        }

        for (let o of response["vel_ref"]){
          this.velref.push(o);
        }

        for (let o of response["eff_ref"]){
          this.effref.push(o);
        }

        for (let entry of this.chains) {
        
          for(let i in this.jval){

            if(entry.Val.Id == this.jid[i]){
              entry.Val.JVal = this.jval[i];
              entry.Val.VVal = this.vvval[i];
              entry.Val.EVal = this.evval[i];
              entry.Val.SVal = this.svval[i];
              entry.Val.DVal = this.dvval[i];
              entry.Val.PRef = this.posref[i];
              entry.Val.VRef = this.velref[i];
              entry.Val.ERef = this.effref[i];
            }
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
        
       });
  }
}
