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
import { NotFoundError } from './../common/not-foud-error';
import { AppError } from './../common/app-error';
//import { Http, RequestOptions, Headers } from '@angular/http';
import { HttpClient } from '@angular/common/http';
//import {throwError as observableThrowError, Observable} from 'rxjs';

@Injectable()
export class HttpService {

  private url: string;

  constructor(private http: HttpClient) { }

  setURL(url){
    this.url = url;
  }

  getAll(){

    
   return this.http.get(this.url);

  }

  get(url){

   return this.http.get(url);

  }

   create(resource){

    let headers = new Headers({'Content-Type': 'application/json'});
   //let options = new RequestOptions({ headers: headers});
    return this.http.post(this.url, JSON.stringify(resource)); //,options);
   }

    post(url,resource){

    let headers = new Headers({'Content-Type': 'application/json'});
    //let options = new RequestOptions({ headers: headers});
    return this.http.post(url, JSON.stringify(resource)); //,options)
    //.map(response => response.json())
    //.catch(this.handleError);
   }

   updatePost(resource){

    //we put in the post only the property that we want modify, so 
    //we send less data to the server
    /*this.http.patch(this.url+'/'+post.id,JSON.stringify({myprop: true}))
    .subscribe(response => {

    })*/

    //or the complete object
    return this.http.put(this.url+'/'+resource.id,JSON.stringify(resource));
   }

    deletePost(post){

      return this.http.delete(this.url+'/'+post.id);
      
        //delete from array using indexof(posts)
   
      
    }

    /*private handleError(error: Response){

       if(error.status === 404)
          return observableThrowError(new NotFoundError());

      return observableThrowError(new AppError(error));
    }*/
}
