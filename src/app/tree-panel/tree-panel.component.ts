import {FlatTreeControl} from '@angular/cdk/tree';
import {Component, Injectable, OnInit} from '@angular/core';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {BehaviorSubject, Observable, of as observableOf} from 'rxjs';

export class DeviceNode {
  children: DeviceNode[];
  devicename: string;
  type: any;
}

/** Flat node with expandable and level information */
export class DeviceFlatNode {
  devicename: string;
  type: any;
  level: number;
  expandable: boolean;
}

/**
 * The file structure tree data in string. The data could be parsed into a Json object
 */
const TREE_DATA = `
  {
    "Robot": {
      "chain_i0": ["namej0",
                  "namej1",
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
}`;

/**
 * File database, it can build a tree structured Json object from string.
 * Each node in Json object represents a file or a directory. For a file, it has filename and type.
 * For a directory, it has filename and children (a list of files or directories).
 * The input will be a json object string, and the output is a list of `FileNode` with nested
 * structure.
 */
@Injectable()
export class FileDatabase {
  dataChange: BehaviorSubject<DeviceNode[]> = new BehaviorSubject<DeviceNode[]>([]);

  get data(): DeviceNode[] { return this.dataChange.value; }

  constructor() {
    this.initialize();
  }

  initialize() {
    // Parse the string to json object.
    const dataObject = JSON.parse(TREE_DATA);
    // Build the tree nodes from Json object. The result is a list of `FileNode` with nested
    //     file node as children.
    const data = this.buildFileTree(dataObject, 0);
    // Notify the change.
    this.dataChange.next(data);
  }

  /**
   * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
   * The return value is the list of `FileNode`.
   */
  buildFileTree(value: any, level: number): DeviceNode[] {
    let data: any[] = [];
    for (let k in value) {
      let v = value[k];
      let node = new DeviceNode();
      node.devicename = `${k}`;
      if (v === null || v === undefined) {
        // no action
      } else if (typeof v === 'object') {
        node.children = this.buildFileTree(v, level + 1);
      } else {
        node.type = v;
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

  ngOnInit(){
  }

  treeControl: FlatTreeControl<DeviceFlatNode>;

  treeFlattener: MatTreeFlattener<DeviceNode, DeviceFlatNode>;

  dataSource: MatTreeFlatDataSource<DeviceNode, DeviceFlatNode>;

  constructor(database: FileDatabase) {
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