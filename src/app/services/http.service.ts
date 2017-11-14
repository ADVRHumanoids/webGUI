import { Injectable } from '@angular/core';
import { NotFoundError } from './../common/not-foud-error';
import { AppError } from './../common/app-error';
import { Http, RequestOptions, Headers } from '@angular/http';
import {Observable} from 'rxjs/Observable'
import 'rxjs/add/operator/catch';
import 'rxjs//add/observable/throw';
import 'rxjs/add/operator/map';

@Injectable()
export class HttpService {

  constructor(private url: string,private http: Http) { }


  getAll(){

   return this.http.get(this.url)
   .map(response => response.json())
   .catch(this.handleError);;

  }

  get(url){

   return this.http.get(url)
   .map(response => response.json())
   .catch(this.handleError);;

  }

   create(resource){

    let headers = new Headers({'Content-Type': 'application/json'});
   let options = new RequestOptions({ headers: headers});
    return this.http.post(this.url, JSON.stringify(resource),options)
    .map(response => response.json())
    .catch(this.handleError);
   }

    post(url,resource){

    let headers = new Headers({'Content-Type': 'application/json'});
   let options = new RequestOptions({ headers: headers});
    return this.http.post(url, JSON.stringify(resource),options)
    .map(response => response.json())
    .catch(this.handleError);
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
          return Observable.throw(new NotFoundError());

      return Observable.throw(new AppError(error));
    }
}
