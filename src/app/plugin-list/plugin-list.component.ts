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

import { HttpClient } from '@angular/common/http';
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
  public plugins = [];

  constructor(http: HttpClient) { 
    
    this.service = new HttpService(http);
    this.service.setURL("/plugins");
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
