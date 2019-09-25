import { Component, Input, Output, EventEmitter, Optional, OnDestroy, forwardRef, HostListener, OnChanges, SimpleChanges, Renderer, ElementRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { Item, Form, NavController, Platform } from 'ionic-angular';
import { SelectSearchablePage } from './select-searchable-page';

@Component({
  selector: 'select-searchable',
  templateUrl: 'select-searchable.html',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SelectSearchable),
    multi: true
  }],
  host: {
    'class': 'select-searchable',
    '[class.select-searchable-ios]': 'isIos',
    '[class.select-searchable-md]': 'isMd',
    '[class.select-searchable-can-reset]': 'canReset'
  }
})
export class SelectSearchable implements ControlValueAccessor, OnDestroy, OnChanges {
  private _items: any[] = [];
  private isIos: boolean;
  private isMd: boolean;
  filterText = '';
  value: any = null;
  model: any = null;
  hasSearchEvent: boolean;
  get items(): any[] {
    return this._items;
  }
  @Input('items')
  set items(items: any[]) {
    // The original reference of the array should be preserved to keep two-way data binding working between SelectSearchable and SelectSearchablePage.
    this._items.splice(0, this._items.length);

    // Add new items to the array.
    Array.prototype.push.apply(this._items, items);
  }
  @Input() isSearching: boolean;
  @Input() useObject = false;
  @Input() canInfiniteScroll = false;
  @Input() pageSize = 25;
  @Input() itemValueField: string;
  @Input() itemTextField: string;
  @Input() canSearch = false;
  @Input() disabled = false;
  @Input() canReset = false;
  @Input() showItemsCount = false;
  @Input() title: string;
  @Input() label: string;
  @Input() placeholder: string;
  @Input() searchPlaceholder: string = 'Enter 3 or more characters';
  @Output() onChange: EventEmitter<any> = new EventEmitter();
  @Output() onSearch: EventEmitter<any> = new EventEmitter();
  @Input() itemTemplate: Function;
  @Input() multiple: boolean;

  constructor(private navController: NavController, private ionForm: Form, private platform: Platform, @Optional() private ionItem: Item, private renderer: Renderer, private elementRef: ElementRef) {

  }

  isNullOrWhiteSpace(value: any): boolean {
    if (value === null || value === undefined) {
      return true;
    }

    // Convert value to string in case if it's not.
    return value.toString().replace(/\s/g, '').length < 1;
  }

  ngOnInit() {
    this.isIos = this.platform.is('ios');
    this.isMd = this.platform.is('android');
    this.hasSearchEvent = this.onSearch.observers.length > 0;
    this.ionForm.register(this);

    if (this.ionItem) {
      this.ionItem.setElementClass('item-select-searchable', true);
    }
  }

  initFocus() { }

  @HostListener('click', ['$event'])
  _click(event: UIEvent) {
    if (event.detail === 0) {
      // Don't continue if the click event came from a form submit.
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.open();
  }

  select(selectedItem: any) {
    this.value = selectedItem;    
    this.emitChange();
  }

  emitChange() {
    if (this.useObject) {
      this.propagateChange(this.value);
      this.onChange.emit({
        component: this,
        value: this.value
      });
    } else {
      this.propagateChange(this.value[this.itemValueField]);
      this.onChange.emit({
        component: this,
        value: this.value[this.itemValueField]
      });
    }  
  }

  emitSearch() {
    this.onSearch.emit({
      component: this,
      text: this.filterText
    });
  }

  open() {
    this.navController.push(SelectSearchablePage, {
      selectComponent: this,
      navController: this.navController
    });
  }

  reset() {
    this.setValue(null);
    this.emitChange();
  }

  formatItem(value: any): string {
    if (this.itemTemplate) {
      return this.itemTemplate(value);
    }

    if (this.isNullOrWhiteSpace(value)) {
      return null;
    }

    return this.itemTextField ? value[this.itemTextField] : value.toString();
  }

  formatValue(): string {
    if (!this.value) {
      if (this.placeholder) {
        return this.placeholder;
      } else {
        return null;
      }     
    }

    if (this.multiple) {
      return this.value.map(item => this.formatItem(item)).join(', ');
    } else {
      return this.formatItem(this.value);
    }
  }

  private propagateChange = (_: any) => { }

  writeValue(value: any) {
    this.setValue(value);
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any) { }

  setDisabledState(isDisabled: boolean) {
    this.renderer.setElementClass(this.elementRef.nativeElement, 'select-searchable-disabled', isDisabled);
    this.renderer.setElementClass(this.ionItem.getNativeElement(), 'item-select-disabled', isDisabled);
  }

  ngOnDestroy() {
    this.ionForm.deregister(this);
  }

  setValue(value: any) {
    this.value = value;

    // Get an item from the list for value.
    // We need this in case value contains only id, which is not sufficient for template rendering.
    if (this.useObject) {
      if (this.value && !this.isNullOrWhiteSpace(this.value[this.itemValueField])) {
        let selectedItem = this.items.find(item => {
          return item[this.itemValueField] === this.value[this.itemValueField];
        });

        if (selectedItem) {
          this.value = selectedItem;
        }
      }
    } else {
      if (this.value) {
        let selectedItem = this.items.find(item => {
          return item[this.itemValueField] === this.value;
        });

        if (selectedItem) {
          this.value = selectedItem;
        }
      }
    }

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['items'] && this.items.length > 0) {
      this.setValue(this.value);
    }
  }
}