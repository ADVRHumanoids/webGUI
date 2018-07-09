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

import { PlotterComponent } from './plotter/plotter.component';
import { CanvasComponent } from './canvas/canvas.component';
import { SliderControlComponent } from './slider-control/slider-control.component';
import { PluginListComponent } from './plugin-list/plugin-list.component';
import { ControlPanelComponent } from './control-panel/control-panel.component';
import { TreePanelComponent } from './tree-panel/tree-panel.component';
import { Component} from '@angular/core';
import { MatTabChangeEvent } from '@angular/material';
import { RobotStateService } from './services/robot-state.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  

  public tabIndex = 0;
  public toggleGlobal = "Global";
  private robotService: RobotStateService;

  constructor(robotService: RobotStateService){
    this.robotService =  robotService;
  }

  changeViewPanel(param){
    //console.log("enableModelView"+ param);
    this.toggleGlobal = param;
    if (param == "Global"){
      this.robotService.controlPanelViewFlag = false;
    }
    else if (param == "Single"){
      this.robotService.controlPanelViewFlag = true;
    }
  }

  onLinkClick(event: MatTabChangeEvent) {
    //console.log('event => ', event);
    this.tabIndex = event.index;
    //console.log('index => ', event.index);
    //console.log('tab => ', event.tab); 
  }
  

}

