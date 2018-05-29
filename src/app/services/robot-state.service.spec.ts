import { TestBed, inject } from '@angular/core/testing';

import { RobotStateService } from './robot-state.service';

describe('RobotStateService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RobotStateService]
    });
  });

  it('should be created', inject([RobotStateService], (service: RobotStateService) => {
    expect(service).toBeTruthy();
  }));
});
