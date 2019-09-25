import { LoadingController, Loading } from 'ionic-angular';

export class BaseComponent {

  public id: string;
  protected loading: Loading;

  constructor(protected loadingCtrl: LoadingController) {   
  }

  protected presentLoading(message?: string, onDidDismiss?) {
    this.loading = this.loadingCtrl.create({
      content: message ? message : "Please wait..."
    });

    this.loading.onDidDismiss(() => {
      if (onDidDismiss) {
        onDidDismiss();
      }
    });

    this.loading.present();
  }

  protected dismissLoading() {
    this.loading.dismiss();
  }

}