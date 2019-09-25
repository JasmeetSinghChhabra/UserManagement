import { Directive, ElementRef, Renderer } from '@angular/core';

@Directive({
  selector: '[shrink-header]',
  host: {
    '(ionScroll)': 'onContentScroll($event)'
  }
})
export class ShrinkDirective {

  header: any;
  tabs: any;
  headerHeight: any;
  translateHeader: number = 0;
  translateTabs: number = 0;
  fixedContent: any;
  scrollContent: any;

  constructor(public element: ElementRef, public renderer: Renderer) {

  }

  ngAfterViewInit() {
    //Look for the parent header 
    this.header = this.element.nativeElement.parentNode.getElementsByTagName("ion-header")[0];
    this.headerHeight = this.header.clientHeight;
    //this.tabs = document.getElementsByClassName("tabbar")[0];
    this.fixedContent = this.element.nativeElement.getElementsByClassName("fixed-content")[0];
    this.scrollContent = this.element.nativeElement.getElementsByClassName("scroll-content")[0];
  }

  onContentScroll(ev) {
    ev.domWrite(() => {
      this.updateHeader(ev);
    });
  }

  updateHeader(ev) {

    if (ev.scrollTop / 5 >= this.headerHeight) return;

    if (ev.scrollTop >= 0) {
      this.translateHeader = -ev.scrollTop / 4;
      this.translateTabs = ev.scrollTop / 4;
    } else {
      this.translateHeader = ev.scrollTop / 4;
      this.translateTabs = -ev.scrollTop / 4;
    }

    this.renderer.setElementStyle(this.header, 'webkitTransform', `translate3d(0,${this.translateHeader}px,0)`);
    //this.renderer.setElementStyle(this.tabs, 'webkitTransform', `translate3d(0,${this.translateTabs}px,0)`);

    //TODO: improve this code, get the initial values in a better way
    let top = 55;
    let bottom = 56;
    if (this.translateTabs >= 0 && this.translateTabs <= 56) {
      top = top - this.translateTabs;
      bottom = bottom - this.translateTabs;
      this.renderer.setElementStyle(this.scrollContent, 'margin-top', `${top}px`);
      //this.renderer.setElementStyle(this.scrollContent, 'margin-bottom', `${bottom}px`);
    }

  }
}