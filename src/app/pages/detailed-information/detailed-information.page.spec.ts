import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailedInformationPage } from './detailed-information.page';

describe('DetailedInformationPage', () => {
  let component: DetailedInformationPage;
  let fixture: ComponentFixture<DetailedInformationPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetailedInformationPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailedInformationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
