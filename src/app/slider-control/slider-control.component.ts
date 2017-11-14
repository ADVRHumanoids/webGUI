import { NotFoundError } from './../common/not-foud-error';
import { AppError } from './../common/app-error';
import { HttpService } from './../services/http.service';
import { Http } from '@angular/http';
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

 constructor(http: Http) { 
    
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
              this.chains.push({ Chain: chna, Val:{ Name :u["Name"] , Id: u["ID"], Val: u["Lval"], Llimit: u["Llimit"], Ulimit: u["Ulimit"] } });
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

  sendVal(param: number, id:number){

    //{"joint":[{"id": 15, "val": 0},{"id": 16, "val": 0}]}
    this.service.create({"joint":[{"id": Number(id), "val": Number(param)}]})
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

        for (let entry of this.chains) {
        
          for(let i in this.jval){

            if(entry.Val.Id == this.jid[i]){
              entry.Val.Val = this.jval[i];
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
