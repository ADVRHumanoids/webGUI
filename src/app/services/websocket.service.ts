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

import {map} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import * as Rx from 'rxjs';
import { Observable, Subject } from 'rxjs';
import {MatSnackBar} from '@angular/material';

@Injectable()
export class WebsocketService {

  constructor(public snackBar: MatSnackBar) { }

    private subject: Rx.Subject<MessageEvent>;
    public messages: Subject<any>;
    private ws : WebSocket;
  
    private connectInternal(url): Rx.Subject<MessageEvent> {
        this.subject = this.create(url);
      return this.subject;
    }
  
    onOpen(){
      if (this.ws.readyState === WebSocket.OPEN) {
        console.log("Successfully connected: ");
        this.snackBar.open("ON-LINE",null,{
          duration: 3000});
      }
    }

    private create(url): Rx.Subject<MessageEvent> {

      console.log("before ws");
      if (this.ws != null) {
        //this.ws.close();
        delete this.ws;
        this.ws = null;
      }
      this.ws = new WebSocket(url);
      console.log(this.ws);
      console.log("after ws");
      console.log(this.ws.readyState);
      
      this.ws.onopen = () => this.onOpen();

      let observable = Rx.Observable.create(
          (obs: Rx.Observer<MessageEvent>) => {
          //ws.onopen.bind(this.onOpen);
          this.ws.onmessage = obs.next.bind(obs);
          this.ws.onerror = obs.error.bind(obs);
          this.ws.onclose = obs.complete.bind(obs);
          return this.ws.close.bind(this.ws);
          })

      let observer = {
          next: (data: Object) => {
            if (this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify(data));
            }
          }
        }
        return Rx.Subject.create(observer, observable);
    }

    public close(){
      this.ws.close();      
    }

    public connect(url){
      this.messages = <Subject<any>>this
      .connectInternal(url).pipe(
      map((response: MessageEvent): any => {
        let data = JSON.parse(response.data);
        return data;
      }));
  
    }
    
}
