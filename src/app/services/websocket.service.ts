
import {map} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import * as Rx from 'rxjs';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class WebsocketService {

  constructor() { }

    private subject: Rx.Subject<MessageEvent>;
    public messages: Subject<any>;
  
    private connectInternal(url): Rx.Subject<MessageEvent> {
      if (!this.subject) {
        this.subject = this.create(url);
        console.log("Successfully connected: " + url);
      } 
      return this.subject;
    }
  
    private create(url): Rx.Subject<MessageEvent> {

      let ws = new WebSocket(url);

      let observable = Rx.Observable.create(
          (obs: Rx.Observer<MessageEvent>) => {
          ws.onmessage = obs.next.bind(obs);
          ws.onerror = obs.error.bind(obs);
          ws.onclose = obs.complete.bind(obs);
          return ws.close.bind(ws);
          })

      let observer = {
          next: (data: Object) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(data));
            }
          }
        }
        return Rx.Subject.create(observer, observable);
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
