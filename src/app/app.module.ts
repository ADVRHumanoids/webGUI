import { RobotStateService } from './services/robot-state.service';
import { HttpService } from './services/http.service';
import { WebsocketService } from './services/websocket.service';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppErrorHandler } from './common/app-error-handler';
import {ErrorHandler} from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { PluginListComponent } from './plugin-list/plugin-list.component';
import { SliderControlComponent } from './slider-control/slider-control.component';
import { FormsModule } from '@angular/forms';
import { CanvasComponent } from './canvas/canvas.component';
import { PlotterComponent } from './plotter/plotter.component';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatToolbarModule} from '@angular/material';

@NgModule({
  declarations: [
    AppComponent,
    PluginListComponent,
    SliderControlComponent,
    CanvasComponent,
    PlotterComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    MatToolbarModule
  ],
  providers: [
     HttpService,
     WebsocketService,
     RobotStateService,
    { provide: ErrorHandler, useClass: AppErrorHandler}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
