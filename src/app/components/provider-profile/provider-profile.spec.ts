import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProviderProfile } from './provider-profile';

describe('ProviderProfile', () => {
  let component: ProviderProfile;
  let fixture: ComponentFixture<ProviderProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProviderProfile],
    }).compileComponents();

    fixture = TestBed.createComponent(ProviderProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
