
import {throwError as observableThrowError, Observable} from 'rxjs';
import { Injectable } from '@angular/core';
import { NotFoundError } from './../common/not-foud-error';
import { AppError } from './../common/app-error';
//import { Http, RequestOptions, Headers } from '@angular/http';
import { HttpClient } from '@angular/common/http';

//import 'rxjs//add/observable/throw';


@Injectable()
export class HttpService {

  constructor(private url: string,private http: HttpClient) { }


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

    private handleError(error: Response){

       if(error.status === 404)
          return observableThrowError(new NotFoundError());

      return observableThrowError(new AppError(error));
    }
}
