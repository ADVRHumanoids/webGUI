import { Http } from '@angular/http';
import { HttpService } from './../services/http.service';
import { Component, OnInit } from '@angular/core';
import { AppError } from './../common/app-error';
import { NotFoundError } from './../common/not-foud-error';


@Component({
  selector: 'app-plugin-list',
  templateUrl: './plugin-list.component.html',
  styleUrls: ['./plugin-list.component.css']
})

export class PluginListComponent implements OnInit {

  private service;
  private plugins = [];

  constructor(http: Http) { 
    
    this.service = new HttpService("/plugins",http);
  }

  ngOnInit() {
    this.service.getAll()
    .subscribe(
      response => {
        console.log(response);
        for (let o of response["Plugins"]){
            this.plugins.push({ Name :o["Name"] , Status: o["Status"] });
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

  onStart(param){

     for (let o of this.plugins){
            if (o.Name == param) o.Status = "RUNNING";
        }
    console.log(param);
     this.service.get("/switch?"+param+"_switch=start")
    .subscribe(
      response => {
        console.log(response);
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

  onStop(param){
      for (let o of this.plugins){
            if (o.Name == param) o.Status = "STOPPED";
        }
    console.log(param);
     this.service.get("/switch?"+param+"_switch=stop")
    .subscribe(
      response => {
        console.log(response);
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
  
  onCmd(param,cmd: String){
      
    console.log(cmd);
    
    this.service.post("/cmd",{ "Name":param+"_cmd" ,"cmd":cmd})
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
  

}
