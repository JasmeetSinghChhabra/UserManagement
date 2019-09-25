export class DashboardModel {
  constructor() {
    this.items = new Array<DashboardModel>();
  }

  id: string; //this is the reportId in accuv system
  title: string;
  text: string;
  value: string;
  type: string;
  items: DashboardModel[];
  accessToken: string;
  embedUrl: string;
  reportId: string;
  pageName: string;
  pages: any[];
  subtitle: string;

  clone(): DashboardModel {
    return Object.assign(new DashboardModel(), this);
  }

}
