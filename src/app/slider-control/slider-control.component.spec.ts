import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SliderControlComponent } from './slider-control.component';

describe('SliderControlComponent', () => {
  let component: SliderControlComponent;
  let fixture: ComponentFixture<SliderControlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SliderControlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SliderControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
