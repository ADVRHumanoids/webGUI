import { Component, OnInit, ElementRef, ViewChild, Renderer2,HostListener, Input} from '@angular/core';
import * as THREE from 'three';
import { HttpService } from './../services/http.service';
import { Http } from '@angular/http';
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
import { Observable, Subject } from 'rxjs/Rx';
import { RobotStateService } from './../services/robot-state.service';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements OnInit {

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
    private robot: Map<string, any>;
    private robotSensor: Map<string, any>;
    private isModelLoaded: boolean;
    private selectJoint: string;
    private selectMaterial: any;
    private isJoint = true;

    private robotState = {
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
      aux : 0
    }

    private robotSensorState = {
      name: "",
      id: 0,
      force: [0,0,0],
      torque: [0,0,0]
    }

    constructor(http: Http, robotService: RobotStateService) { 
      console.log(THREE);
      this.isModelLoaded = true;
      this.service = new HttpService("/model",http);
      this.robotService = robotService;
      this.robot = new Map<string, any>();
      this.robotSensor = new Map<string, any>();
      this.robotService.currentmsg.subscribe(msg => {	
        this.robot = msg["robot"];
        this.robotSensor = msg["sensor"];
        if(this.robot != null){
          var item = this.robot.get(this.selectJoint);
          if (item != null)
            this.robotState = item;
        }

        if (this.robotSensor!= null && this.selectedObject != null){
          var userdata = this.selectedObject.userData;
          if (userdata != null){
            var sensor = userdata["name"];
            var items = this.robotSensor.get(sensor);
            if (items != null)
              this.robotSensorState = items;
          }
        }
        
    });
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
      this.init(); 
      this.getData();
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
     this.isModelLoaded = true;
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
  
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(view.angle, view.aspect, view. near, view.far);
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
      this.container.appendChild(this.renderer.domElement);
 
      this.render();
    }
  
    @HostListener('document:mousedown', ['$event'])
    checkIntersection (event: MouseEvent) {
      var rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ( ( event.clientX - rect.left ) / rect.width ) * 2 - 1;
      this.mouse.y = - ( ( event.clientY - rect.top ) / rect.height ) * 2 + 1;
      //console.log(this.mouse.x + "" +this.mouse.y);
      if(event.which === 1)
        this.CheckIntersection ();
    }

    render(){
      let self: CanvasComponent = this;
      (function render(){
        requestAnimationFrame(render);
        self.renderer.render(self.scene, self.camera);
      }());
      
    }
  
    CheckIntersection () {
      this.raycaster.setFromCamera (this.mouse, this.camera);
      let intersects = this.raycaster.intersectObjects ( this.scene.children, true);
      //console.log(this.scene.children);
      if (intersects.length > 0) {
        if (this.selectedObject != null){
          (<THREE.Mesh>this.selectedObject).material = this.selectMaterial;
        }
        this.selectedObject = intersects[0].object;
        this.selectMaterial = (<THREE.Mesh>this.selectedObject).material;
        (<THREE.Mesh>this.selectedObject).material = new THREE.MeshPhongMaterial( { color: 0xFFFF, specular: 0x111111, shininess: 200 } );
        //console.log(this.selectedObject);
        var userdata = this.selectedObject.parent.userData;
        if (userdata != null){
          if (this.jointmap.get(userdata["name"])!= null) this.isJoint = true;
          this.selectJoint = userdata["name"];
        }
        var userdata = this.selectedObject.userData;
        if (userdata != null){
          if (this.robotSensor.get(userdata["name"])!= null) this.isJoint = false;
        }
    }
  }

}
