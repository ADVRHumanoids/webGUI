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

import { Component, OnInit, ElementRef, ViewChild, Renderer2,HostListener, Input,AfterViewInit, OnDestroy} from '@angular/core';
import * as THREE from 'three';
import { HttpService } from './../services/http.service';
import { HttpClient } from '@angular/common/http';
import { NotFoundError } from './../common/not-foud-error';
import { AppError } from './../common/app-error';
var OrbitControls = require('three-orbit-controls')(THREE)
//import * as STLLoader from 'three-stl-loader';
var STLLoader = require('three-stl-loader')(THREE)
//declare var ColladaLoader : any;
//var ColladaLoader = require('three-collada-loader')(THREE);
//import {ColladaLoader} from "three";
///var coll_loader = new ColladaLoader();
var loader = new STLLoader()
import TrackballControls = THREE.TrackballControls;
import { Scene, Vector2, Material, } from 'three';
import { Observable, Subject} from 'rxjs';
import { RobotStateService } from './../services/robot-state.service';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements OnInit, AfterViewInit, OnDestroy {
 
  title = 'app';
  
    @ViewChild('container') elementRef: ElementRef;
    private container : HTMLElement;
  
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: any;
  
    private linkmap = new Map<string, THREE.Object3D>();
   
    private jointmap = new Map<string, THREE.Object3D>();

    private selectedObject: THREE.Object3D;
    private raycaster: THREE.Raycaster;
    private mouse : THREE.Vector2;
    private cube : THREE.Mesh;
    
    private order = 'XYZ';
    private vval: number;
    private service;
    private robotService: RobotStateService;
    /*private robot: Map<string, any>;
    private robotSensor: Map<string, any>;*/
    private isModelLoaded: boolean;
    private selectMaterial: any;
    private idAnimationFrame;
    private timeout;

    /*private robotState = {
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
      fault: 0,
      aux : 0,
      refPos: 0,
      refVel: 0,
      refTor: 0
    }

    private robotSensorState = {
      name: "",
      id: 0,
      forcex: 0,
      forcey: 0,
      forcez: 0,
      torquex: 0,
      torquey: 0,
      torquez: 0,
    }*/

    constructor(http: HttpClient, robotService: RobotStateService) { 
      console.log(THREE);
      this.isModelLoaded = true;
      this.service = new HttpService(http);
      this.service.setURL("/model");
      this.robotService = robotService;
     /* this.robot = new Map<string, any>();
      this.robotSensor = new Map<string, any>();
      this.robotService.currentmsg.subscribe(msg => {	
        this.robot = msg["robot"];
        this.robotSensor = msg["sensor"];
        if(this.robot != null){
          var item = this.robot.get(this.selectJoint);
          if (item != null)
            this.robotState = item;
        }

        this.robotService.selectJointName = this.selectJoint;
        if(this.isJoint)
          this.robotService.selectJointId = this.robotState.id;
        else
          this.robotService.selectJointId = this.robotSensorState.id;
          

        if (this.robotSensor!= null && this.selectedObject != null){
          var userdata = this.selectedObject.userData;
          if (userdata != null){
            var sensor = userdata["name"];
            var items = this.robotSensor.get(sensor);
            if (items != null)
              this.robotSensorState = items;
          }
        }
        
    });*/
    }
    
    createNodeLink(pos,rot_axis,angle,scale){
      
      var tmp = new THREE.Mesh();
      tmp.position.set( pos[0], pos[1], pos[2] );
      if(rot_axis != null){
        tmp.setRotationFromAxisAngle(new THREE.Vector3(rot_axis[0],rot_axis[1],rot_axis[2]), angle);
      }
      if (scale != null)
        tmp.scale.set( 1, 1, 1 );

      return tmp;
    }

    createNodeJoint(pos,rot_axis,angle){
      
      var tmp = new THREE.Object3D();
      tmp.position.set( pos[0], pos[1], pos[2] );
      if(rot_axis != null){
        tmp.setRotationFromAxisAngle(new THREE.Vector3(rot_axis[0],rot_axis[1],rot_axis[2]), angle);
      }
      return tmp;
    }

    parseJoints(joints){

      for (let joint of joints){
        var name = joint["Name"];
        var child = joint["Child"];
        var parent = joint["Parent"];
        var pos = joint["Pos"];
        if (pos == null) pos = [0,0,0];
        var rot = joint["Rot"];
        var axis;
        var angle;
        if ( rot != null){
          axis = rot["Axis"];
          angle = rot["Angle"];
        }else {
          axis = null;
          angle = null;
        }
        var raxis = joint["Axis"];
        var nodel1 = this.createNodeJoint(pos,axis,angle);
        nodel1.userData = {"axis": raxis, "name": name};
        var clink = this.linkmap.get(child);
        var plink = this.linkmap.get(parent);
        nodel1.add(clink);
        plink.add(nodel1);
        this.jointmap.set(name, nodel1);
      }

    }

    parseLinks(links){

      for (let link of links){
        var name = link["Name"];
        var pos = link["Pos"];
        if (pos == null) pos = [0,0,0];
        var rot = link["Rot"];
        var axis;
        var angle;
        if ( rot != null){
          axis = rot["Axis"];
          angle = rot["Angle"];
        }else {
          axis = null;
          angle = null;
        }
        var mesh = link["Mesh"];
        var material = link["Material"];
        var scale = link["Scale"];
        var nodel = this.createNodeLink(pos,axis,angle,scale);
        if (mesh != null)
          nodel.userData = {"mesh":mesh, "scale": scale, "load": false};
        this.linkmap.set(name, nodel);
        var sensor = link["Sensor"];
        if (sensor != null){
          var marker = this.addSensorMarker([0,0,0],0.08);
          nodel.geometry = marker.geometry;
          nodel.material = marker.material;
          nodel.userData = {"name":name};
        }
      }

    }

    getData(){

      this.service.get("/model")
      .subscribe(
        response => {
          var root = response["Model"];
          var joints = root["Joint"];
          var links = root["Link"];
          this.parseLinks(links);
          this.parseJoints(joints);
          var root_link = root["Root_Link"];
          var root_joint = root["Root_Joint"];
          var link = this.linkmap.get(root_link);
          var joint = this.jointmap.get(root_joint);
          link.rotation.set(-Math.PI/2 , 0, 0 );
          link.add(joint);
          this.scene.add(link);

          //SAVE STATE
          this.robotService.CanvasState.camera = this.camera;
          this.robotService.CanvasState.scene = this.scene;
          this.robotService.CanvasState.controls = this.controls;
          this.robotService.CanvasState.jointMap = this.jointmap;
          this.robotService.CanvasState.linkMap = this.linkmap;
          this.robotService.CanvasState.renderer = this.renderer;
          this.robotService.CanvasState.state = 1;

          /*var fkey;
          for (let entry of Array.from(this.jointmap.entries())) {
            fkey = entry[0];
          }
          this.robotService.selectJointSensorName = fkey;
          this.robotService.advertiseSelectedJoint(this.robotService.selectJointSensorName);
          */
           //load meshes
          this.linkmap.forEach((value: THREE.Object3D, key: string) => {
            if(value.userData != null){
              var mesh = <string>value.userData["mesh"];
              if (mesh != null){
                var ext = mesh.substr(mesh.length-3);
                if (ext != null)
                  if (ext.toUpperCase() == "STL"){
                    mesh = mesh.substr(10);
                    mesh = "/robots/"+mesh;
                    loader.load(mesh, (geometry, id = key) => 
                    {this.loadMesh(geometry,id)});
                  }
              }
            } 
          });

        },
        (error: AppError) => {
  
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

    ngOnInit(){
      this.container = this.elementRef.nativeElement;
      //console.log(this.container);
      this.raycaster = new THREE.Raycaster ();
      this.mouse = new THREE.Vector2 ();
      var isInit = this.init(); 
      if (!isInit) this.getData();
    }

    addVectorMarker(){

      var material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
      
      var geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3( 0, 0, 0) );
      geometry.vertices.push(new THREE.Vector3( 0, 10, 0) );
      var line = new THREE.Line( geometry, material );
      return line;
    }
    
    addSensorMarker(pos, size){

      var geometry = new THREE.BoxGeometry( size, size, size );
      var material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
      var cube = new THREE.Mesh( geometry, material );
      cube.position.set(pos[0],pos[1],pos[2]);
      return cube;
    }

    setVelRef(param: number){
      
     this.vval = param;
     //this.selectedObject.rotateOnAxis(new THREE.Vector3(0,0,1),param);
     /*var userdata = this.selectedObject.parent.userData;
     if (userdata != null){
        var axis = userdata["axis"];
        //this.selectedObject.setRotationFromAxisAngle(new THREE.Vector3(axis[0],axis[1],axis[2]),param);
     }*/
    }
  
    loadMesh(geometry, id){

      var material;
      //console.log("ID "+id);
      if (geometry.hasColors) {
          material = new THREE.MeshPhongMaterial({ opacity: geometry.alpha, vertexColors: THREE.VertexColors });
        } 
        else{
          material = new THREE.MeshPhongMaterial( { color: 0xAAAAAA, specular: 0x111111, shininess: 200 } );
        }

      //geometry.computeFaceNormals();
      let  mesh = new THREE.Mesh( geometry, material );
      material.side = THREE.DoubleSide;
      //THREE.EventDispatcher.call( mesh );
      //mesh.addEventListener('click', function(event) {alert("GOT THE EVENT");});
      //mesh.dispatchEvent({type:'click'});
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (this.linkmap != null){
        let my = <THREE.Mesh>this.linkmap.get(id);
        my.geometry = mesh.geometry;
        var scale = my.userData["scale"];
        if (scale != null)
          my.geometry.scale(scale[0],scale[1],scale[2]);
        my.material = mesh.material;
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();
        my.userData["load"] = true;
      }
    }
  
    init(){
      let screen = {
        width  : 500,
        height : 400
      },
      view = {
        angle  : 45,
        aspect : screen.width / screen.height,
        near   : 0.1,
        far    : 1000
      };
  
      var status = false;
      //Load state
      if (this.robotService.CanvasState.state != 0){
        if (this.robotService.CanvasState.camera != null)
          this.camera = this.robotService.CanvasState.camera;
        if (this.robotService.CanvasState.controls != null)
          this.controls = this.robotService.CanvasState.controls;
        if (this.robotService.CanvasState.scene != null)
          this.scene = this.robotService.CanvasState.scene;
        if (this.robotService.CanvasState.linkMap != null)
          this.linkmap = this.robotService.CanvasState.linkMap;
        if (this.robotService.CanvasState.jointMap != null)
          this.jointmap = this.robotService.CanvasState.jointMap;
        if (this.robotService.CanvasState.renderer != null)
          this.renderer = this.robotService.CanvasState.renderer;
        status = true;
      }
      else {

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(view.angle, view.aspect, view.near, view.far);
        this.renderer = new THREE.WebGLRenderer();
        this.controls = new OrbitControls(this.camera,this.renderer.domElement);
        this.scene.background = new THREE.Color( 0x72645b );
        this.scene.add(this.camera);
        //this.scene.add(new THREE.AxisHelper(20));
        
         // lights
        var light = new THREE.PointLight( 0xffffff, 0.8 );
        this.camera.add( light );
        this.camera.position.set(1,0.5,2);
        this.camera.lookAt(new THREE.Vector3(0,0,0));
    
        //this.camera.up.set(0,0,1);
        this.scene.add( new THREE.AmbientLight( 0x222222 ) );
        this.renderer.setSize(screen.width, screen.height);
        status = false;
      }

      this.render();
      this.container.appendChild(this.renderer.domElement);
      window.addEventListener('resize', this.OnWindowResize);
      this.container.addEventListener('click',this.Onclick);

      return status;
    }

    OnWindowResize = EventListener => {
      this.resize();
      this.render();
    }

    Onclick = MouseEvent =>{
      var rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ( ( MouseEvent.clientX - rect.left ) / rect.width ) * 2 - 1;
      this.mouse.y = - ( ( MouseEvent.clientY - rect.top ) / rect.height ) * 2 + 1;
      //console.log(this.mouse.x + "" +this.mouse.y);
      if(MouseEvent.which === 1)
        this.CheckIntersection ();
    }

    resize(){
      this.container.style.width = "100%";
      this.container.style.height = "100%";
      //console.log("onResize: " + this.container.clientWidth + ", " + this.container.clientHeight);

      this.camera.aspect = this.getAspectRatio();
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
  
    ngAfterViewInit() {
      console.log("ngAfterViewInit");
      this.timeout = setTimeout(()=>{ 
        this.resize();
      },100);
    }

    private disposeNode(node) {
      if (node instanceof THREE.Mesh) {
          node.parent = undefined;
          if (node.geometry) {
              node.geometry.dispose();
          }
          let material: any = node.material;
          if (material) {
              if (material.map) material.map.dispose();
              if (material.lightMap) material.lightMap.dispose();
              if (material.bumpMap) material.bumpMap.dispose();
              if (material.normalMap) material.normalMap.dispose();
              if (material.specularMap) material.specularMap.dispose();
              if (material.envMap) material.envMap.dispose();
              material.dispose();
          }
      } else if (node instanceof THREE.Object3D) {
          node.parent.remove(node);
          node.parent = undefined;
      }
    }

    private disposeHierarchy(node, callback) {
      for (var i = node.children.length - 1; i >= 0; i--) {
          var child = node.children[i];
          this.disposeHierarchy(child, callback);
          callback(child);
      }
    }

    ngOnDestroy() {
     
      cancelAnimationFrame(this.idAnimationFrame);
      clearTimeout(this.timeout);
      window.removeEventListener('resize', this.OnWindowResize);
      this.container.removeEventListener('click',this.Onclick);
      this.idAnimationFrame = null;
      if (this.selectedObject != null){
        (<THREE.Mesh>this.selectedObject).material = this.selectMaterial;
      }
      /*if (this.scene != null)
        while (this.scene.children.length > 0) {
          let obj = this.scene.children[0];
          this.scene.remove(obj);
          this.disposeHierarchy(obj, this.disposeNode);
        }*/
      this.robotService = null;
      this.linkmap = null;
      this.jointmap = null;
      this.service = null;
      this.scene = null;
      this.camera = null;
      this.controls = null;
      this.container = null;
    }
   
    /*@HostListener('document:mousedown', ['$event'])
    checkIntersection (event: MouseEvent) {
      var rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ( ( event.clientX - rect.left ) / rect.width ) * 2 - 1;
      this.mouse.y = - ( ( event.clientY - rect.top ) / rect.height ) * 2 + 1;
      //console.log(this.mouse.x + "" +this.mouse.y);
      if(event.which === 1)
        this.CheckIntersection ();
    }*/

    private getAspectRatio(): number {
      let height = this.container.clientHeight;
      if (height === 0) {
          return 0;
      }
      return this.container.clientWidth / this.container.clientHeight;
    }

    /*@HostListener('window:resize', ['$event'])
    public onResize(event: Event) {
        this.resize();
        this.render();
    }*/

    render(){
      let self: CanvasComponent = this;
      (function render(){
        self.idAnimationFrame = requestAnimationFrame(render);
        if(self.scene != null && self.camera != null)
          self.renderer.render(self.scene, self.camera);
        if (self.selectedObject != null){
          (<THREE.Mesh>self.selectedObject).material = self.selectMaterial;
        }
        var joint = null;
        if(self.jointmap != null)
          joint = self.jointmap.get(self.robotService.selectJointSensorName)
        if (joint!= null) { 
          self.selectedObject = joint.children[0]; 
          self.selectMaterial = (<THREE.Mesh>self.selectedObject).material;
          (<THREE.Mesh>self.selectedObject).material = new THREE.MeshPhongMaterial( { color: 0xFFFF, specular: 0x111111, shininess: 200 } );
        }
        else {
          var sensor = null;
          if(self.linkmap != null)
            sensor = self.linkmap.get(self.robotService.selectJointSensorName);
          if(sensor != null){
            self.selectedObject = sensor; 
            self.selectMaterial = (<THREE.Mesh>self.selectedObject).material;
            (<THREE.Mesh>self.selectedObject).material = new THREE.MeshPhongMaterial( { color: 0xFFFF, specular: 0x111111, shininess: 200 } );
          }
        }

      }());
    }
  
    CheckIntersection () {
      this.raycaster.setFromCamera (this.mouse, this.camera);
      let intersects = this.raycaster.intersectObjects ( this.scene.children, true);
      //console.log(this.scene.children);
      if (intersects.length > 0) {
        var objs = intersects[0].object;
        //console.log(this.selectedObject);
        var userdata = objs.parent.userData;
        if (userdata != null){
          if (this.jointmap.get(userdata["name"])!= null)
          {                          
            var name = userdata["name"];
            var id =this.robotService.getJointId(name);
            if (id != null) {
              this.robotService.isJoint = true;
              this.robotService.selectJointSensorName = name;
              this.robotService.selectJointSensorId = id;
            }
          }
        }
        var userdata = objs.userData;
        if (userdata != null){
            var sensor = userdata["name"];
            if(sensor != null){
              this.robotService.isJoint = false;
              this.robotService.selectJointSensorName = sensor;
            }
        }
        this.robotService.advertiseSelectedJoint(this.robotService.selectJointSensorName);
    }
  }

}
