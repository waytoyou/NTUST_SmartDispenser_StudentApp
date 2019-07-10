import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MtProgressPage } from './mt-progress.page';

describe('MtProgressPage', () => {
  let component: MtProgressPage;
  let fixture: ComponentFixture<MtProgressPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MtProgressPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MtProgressPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
