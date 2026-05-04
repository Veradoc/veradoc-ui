import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelsRunningComponent } from './models-running.component';

describe('Collections', () => {
  let component: ModelsRunningComponent;
  let fixture: ComponentFixture<ModelsRunningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelsRunningComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelsRunningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
