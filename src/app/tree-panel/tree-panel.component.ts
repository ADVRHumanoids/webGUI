import {FlatTreeControl} from '@angular/cdk/tree';
import {Component, Injectable, OnInit} from '@angular/core';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {BehaviorSubject, Observable, of as observableOf} from 'rxjs';
import { HttpService } from './../services/http.service';
import { HttpClient } from '@angular/common/http';
import { NotFoundError } from './../common/not-foud-error';
import { AppError } from './../common/app-error';
import { RobotStateService } from './../services/robot-state.service';

export class DeviceNode {
  children: DeviceNode[];
  devicename: string;
  type: any;
  isJoint: boolean;
}

/** Flat node with expandable and level information */
export class DeviceFlatNode {
  devicename: string;
  type: any;
  isJoint: boolean;
  level: number;
  expandable: boolean;
}


@Injectable()
export class FileDatabase {
  dataChange: BehaviorSubject<DeviceNode[]> = new BehaviorSubject<DeviceNode[]>([]);

  get data(): DeviceNode[] { return this.dataChange.value; }

  private service;
 
  constructor(http: HttpClient) {
    this.service = new HttpService(http);
    this.service.setURL("/state");
    this.initialize();
  }

  getData(){

    this.service.get("/state")
    .subscribe(
      response => {
        var robot = response["Robot"];
        var joints = robot["joint_name"];
        var sensors = response["Sensors"];
        var fts = sensors["fts"];
        var ft = fts["ft_name"];
        var imus = sensors["imus"];
        var imu = imus["imu_name"];

        /*var obj = {

            "Robot": {
              "chain_i0": ["namej0",
                          "nasmej1",
                          "namej1",
                          "namej1",
                          "namej1",
                          "namej1",
                          "namej5"],
              "chain_i1": ["namej0",
                          "namej1"]
            },
            "Sensor": ["sensor0",
                      "sensor1"]
        
        };*/

        var obj = {
            "Robot":  joints,
            "Sensor": {"fts": ft,"imus": imu}        
        };
        var stringjson = JSON.stringify(obj);
        const dataObject = JSON.parse(stringjson);
        const data = this.buildFileTree(dataObject, 0,false);
        // Notify the change.
        this.dataChange.next(data);

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
  initialize() {
    // Parse the string to json object.
    this.getData();
  }

  buildFileTree(value: any, level: number, isJoint: boolean): DeviceNode[] {
    let data: any[] = [];
    for (let k in value) {
      let v = value[k];
      let node = new DeviceNode();
      node.devicename = `${k}`;
      if (v === null || v === undefined) {
        // no action
      } else if (typeof v === 'object') {
        if (node.devicename == "Robot") 
          node.children = this.buildFileTree(v, level + 1, true );
        else
          node.children = this.buildFileTree(v, level + 1, false );
      } else {
        node.type = v;
        if(isJoint)
           node.isJoint = true;
        else
           node.isJoint = false;
      }
      data.push(node);
    }
    return data;
  }
}

@Component({
  selector: 'app-tree-panel',
  templateUrl: './tree-panel.component.html',
  styleUrls: ['./tree-panel.component.css'],
  providers: [FileDatabase]
})
export class TreePanelComponent implements OnInit {

  public selectedDevice="";
  public jointId;
  public isJoint= true;
  private timeout;

  ngOnInit(){
  }

  setActiveDevice(param, param1){
    this.selectedDevice = param;
    //this.isJoint = this.robotService.isJoint;
    this.robotService.selectJointSensorName = param;   
    if(param1 != null) {  
      this.robotService.isJoint = param1;
      this.isJoint = this.robotService.isJoint;
    }
    if(param1 != null && param1){
      this.jointId = this.robotService.getJointId(param);
      this.robotService.selectJointSensorId = this.jointId;
      this.robotService.selectJointSensorName = param;
    }
  }

  plotState(id, name){
    if(this.isJoint){
      this.robotService.changeView("AllPlots"); 
      this.timeout = setTimeout(()=>{ 
        this.robotService.plotState(this.robotService.selectJointSensorId,this.robotService.selectJointSensorName);
      },200);  
    }
  }

  treeControl: FlatTreeControl<DeviceFlatNode>;

  treeFlattener: MatTreeFlattener<DeviceNode, DeviceFlatNode>;

  dataSource: MatTreeFlatDataSource<DeviceNode, DeviceFlatNode>;
  private robotService: RobotStateService;

  constructor(database: FileDatabase,robotService: RobotStateService) {
    this.robotService = robotService;
    this.robotService.currentJointmsg.subscribe(msg => {	
      this.selectedDevice = msg;
      this.isJoint = this.robotService.isJoint;
    });

    this.treeFlattener = new MatTreeFlattener(this.transformer, this._getLevel,
      this._isExpandable, this._getChildren);
    this.treeControl = new FlatTreeControl<DeviceFlatNode>(this._getLevel, this._isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    database.dataChange.subscribe(data => {
      this.dataSource.data = data;
    });
  }

  transformer = (node: DeviceNode, level: number) => {
    let flatNode = new DeviceFlatNode();
    flatNode.devicename = node.devicename;
    flatNode.type = node.type;
    flatNode.level = level;
    flatNode.isJoint = node.isJoint;
    flatNode.expandable = !!node.children;
    return flatNode;
  }

  private _getLevel = (node: DeviceFlatNode) => { return node.level; };

  private _isExpandable = (node: DeviceFlatNode) => { return node.expandable; };

  private _getChildren = (node: DeviceNode): Observable<DeviceNode[]> => {
    return observableOf(node.children);
  }

  hasChild = (_: number, _nodeData: DeviceFlatNode) => { return _nodeData.expandable; };
}