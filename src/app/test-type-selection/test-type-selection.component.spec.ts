import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestTypeSelectionComponent } from './test-type-selection.component';

describe('TestTypeSelectionComponent', () => {
  let component: TestTypeSelectionComponent;
  let fixture: ComponentFixture<TestTypeSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestTypeSelectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestTypeSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
