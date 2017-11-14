import { HttpService } from './services/http.service';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppErrorHandler } from './common/app-error-handler';
import {ErrorHandler} from '@angular/core';
import {HttpModule} from '@angular/http';

import { AppComponent } from './app.component';
import { PluginListComponent } from './plugin-list/plugin-list.component';
import { SliderControlComponent } from './slider-control/slider-control.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    PluginListComponent,
    SliderControlComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule
  ],
  providers: [
     HttpService,
    { provide: ErrorHandler, useClass: AppErrorHandler}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
