import {
    Component,
    OnInit,
    OnChanges,
    SimpleChanges,
    Input,
    Inject,
    Output,
    ViewChild,
    ElementRef,
    EventEmitter
  } from '@angular/core';
  import { service as PBIService, IEmbedConfiguration, Embed, models } from 'powerbi-client';
  
  @Component({
    selector: 'power-bi',
    templateUrl: 'power-bi.html',
  })
  export class PowerBIComponent implements OnInit, OnChanges {
    component: Embed;
    @Input() powerBiModel: PowerBIModel;
    @Input() accessToken: string;
    @Input() tokenType: string;
    @Input() embedUrl: string;
    @Input() type: string;
    @Input() id: string;
    @Input() dashboardId: string;
    @Input() pageName: string;
    @Input() visualName: string;
    @Output() embedded: EventEmitter<any> = new EventEmitter<any>();
    @Output() loaded: EventEmitter<any> = new EventEmitter<any>();
    @Output() tileClicked: EventEmitter<any> = new EventEmitter<any>();
    @ViewChild('powerbiFrame') powerbiFrame: ElementRef;
  
  
    constructor( @Inject('PowerBIService') public powerBIService: PBIService.Service) {
    }
  
    ngOnInit(): void {
      const { accessToken, tokenType, embedUrl, type, id, dashboardId, pageName, visualName } = this;
      let config: IEmbedConfiguration = { 
          accessToken, 
          tokenType: this.getTokenType(tokenType), 
          embedUrl, 
          type, 
          id,
          pageView: "oneColumn"
      };
  
      if (this.validateOptions(accessToken, embedUrl)) {
        this.embed(this.powerbiFrame.nativeElement, config);
      }
    }
  
    ngOnChanges(changes: SimpleChanges): void {      
      
      let config = this.getConfig(changes);
      if(!config) return;
      
      if (this.validateOptions(config.accessToken, config.embedUrl)) {
        console.log(config);
        this.embed(this.powerbiFrame.nativeElement, config);
      } else {
        this.reset(this.powerbiFrame.nativeElement);
      }
    }
  
    /**
     * Validates if needed accessToken and embedUrl aren't empty and are strings
     * @param {string} accessToken - access token to embed component, obtained through pbi rest api
     * @param {string} embedUrl - url obtained through pbi rest api or pbi app
     * @return {boolean}
     */
    validateOptions(accessToken: string, embedUrl: string): boolean {
      if (!(typeof embedUrl === 'string' && embedUrl.length > 0)
        || !(typeof accessToken === 'string' && accessToken.length > 0)
      ) {
        return false;
      }
      return true;
    }
  
    /**
     * Get the token type class or enum from string ('Embed' or 'Aad')
     * @param {string} tokenType - token type class name in string it must be 'Embed' or 'Aad'
     * @return {models.TokenType}
     */
    getTokenType(tokenType: string): models.TokenType {
      // convert token type string to model class to avoid import of powerbi-client in app
      if (!tokenType || tokenType.length < 0) {
        // default is AAD
        return models.TokenType.Aad;
      } else {
        // capitalize
        tokenType = tokenType.charAt(0).toUpperCase() + tokenType.toLowerCase().slice(1);
        return models.TokenType[tokenType];
      }
    }
  
    getType(type: PowerBIType): string {
      switch (type) {
        case PowerBIType.Dashboard:
          return "dashboard";
        case PowerBIType.Report:
          return "report";
        case PowerBIType.Tile:
          return "tile";
        case PowerBIType.ReportVisual:
          return "visual";
        default:
          return "report";
      }          
    }

    /**
     * Executes an embeding operation with pbi client library
     * and assign the embed component to a property
     * @param {HTMLEelement} element - native element to embed pbi dashboard, report, or whatever
     * @param {IEmbedConfiguration} config - configuration to embed
     * @param {string} config.accessToken - access token to embed component, obtained through pbi rest api
     * @param {string} config.tokenType - type of accessToken, the most common is TokenType.Embed
     * @param {string} config.embedUrl - url obtained through pbi rest api or pbi app
     * @param {string} config.type - type of embedded component, like 'report' or 'dashboard'
     * @param {string} config.id - component/element id like '5dac7a4a-4452-46b3-99f6-a25915e0fe55'
     */
    embed(element: HTMLElement, config: IEmbedConfiguration) {
      this.component = this.powerBIService.embed(element, config);
      this.embedded.emit((this.component as any));
      this.component.on('loaded', () => {
        this.loaded.emit((this.component as any));
      });
    }
  
    /**
     * Reset the component to delete the last embedded component
     * @param {HTMLElement} element - native element where the embedded was made
     */
    reset(element: HTMLElement) {
      this.powerBIService.reset(element);
      this.component = null;
    }

    getConfig(changes: SimpleChanges): IEmbedConfiguration {

      const { accessToken, tokenType, embedUrl, type, id, dashboardId, pageName, visualName, powerBiModel } = changes;
      let config;

      if (powerBiModel) { //Use the model object if provided

        if (powerBiModel.previousValue) {
          if (powerBiModel.previousValue.accessToken === powerBiModel.currentValue.accessToken ||
            powerBiModel.previousValue.embedUrl === powerBiModel.currentValue.embedUrl) {
            return;
          }
        }

        if(!powerBiModel.currentValue) return;

        config = {
          accessToken: powerBiModel.currentValue.accessToken,
          tokenType: powerBiModel.currentValue.tokenType ? this.getTokenType(powerBiModel.currentValue.tokenType) : models.TokenType.Aad,
          embedUrl: powerBiModel.currentValue.embedUrl,
          type: this.getType(powerBiModel.currentValue.type),
          id: powerBiModel.currentValue.id,
          dashboardId: powerBiModel.currentValue.dashboardId,
          pageName: powerBiModel.currentValue.pageName,
          visualName: powerBiModel.currentValue.visualName,
          pageView: "oneColumn"
        };
      } else { //Use individual properties, binding accessToken was not working fine in this way

        if (accessToken.previousValue === accessToken.currentValue ||
          embedUrl.previousValue === embedUrl.currentValue) {
          return;
        }

        config = {
          accessToken: accessToken && accessToken.currentValue,
          tokenType: tokenType ? this.getTokenType(tokenType.currentValue) : models.TokenType.Aad,
          embedUrl: embedUrl && embedUrl.currentValue,
          type: type && this.getType( type.currentValue),
          id: id && id.currentValue,
          dashboardId: dashboardId && dashboardId.currentValue,
          pageName: pageName && pageName.currentValue,
          visualName: visualName && visualName.currentValue,
          pageView: "oneColumn"
        };     
      }
      
      if(!config) return;

      if(config.type == "dashboard"){
        config.settings = {
          layoutType: models.LayoutType.MobilePortrait
        }
      } else if(config.type == "report") {        
        //config.permissions = models.Permissions.All;
        config.settings = {
          layoutType: models.LayoutType.MobilePortrait,
          filterPaneEnabled: false,
          navContentPaneEnabled: true
        }
      }

      return config;
    }

  }

  export class PowerBIModel {

    constructor() {  
    }
    
    accessToken: string;
    embedUrl: string;
    tokenType: string;
    type: PowerBIType;
    id: string;
    dashboardId?: string;
    pageName?: string;
    visualName?: string;

    static getType(type: string): PowerBIType {
      switch (type.toLowerCase()) {
        case "dashboard":
          return PowerBIType.Dashboard;
        case "report":
          return PowerBIType.Report;
        case "tile":
          return PowerBIType.Tile;
        case "visual":
          return PowerBIType.ReportVisual;
        default:
          throw "Power BI type not supported: " + type;
      } 
    }
  }

  export enum PowerBIType {
    Dashboard = 1,
    Report  = 2,
    Tile = 3,
    ReportVisual = 4
  }