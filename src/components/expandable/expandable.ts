import { Component, Input, ViewChild, ElementRef, Renderer, NgModule } from '@angular/core';

@Component({
  selector: 'expandable',
  templateUrl: 'expandable.html'
})
export class ExpandableComponent {

  @ViewChild('expandWrapper', { read: ElementRef }) expandWrapper;
  @Input('expanded') expanded;
  @Input('expandHeight') expandHeight;

  constructor(public renderer: Renderer) {

  }

  ngAfterViewInit() {
    if (this.expandHeight == "auto") {
      this.renderer.setElementStyle(this.expandWrapper.nativeElement, 'height', "auto");
    } else {
      this.renderer.setElementStyle(this.expandWrapper.nativeElement, 'height', this.expandHeight + 'px'); 
    }    
  }

}
