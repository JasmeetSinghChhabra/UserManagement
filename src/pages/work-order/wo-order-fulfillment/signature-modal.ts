import { Component, ViewChild } from '@angular/core';
import { ViewController, NavParams, IonicPage, LoadingController } from 'ionic-angular';
import { SignaturePad } from 'angular2-signaturepad/signature-pad';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppService } from '../../../services/common/app.service';
import { PackedItem } from '../../../models/work-order/order-fulfillment';
import { WorkOrderService, SignatureService } from '../../../services/services';
import { BaseComponent } from '../../../components/base.component';
import { WorkOrderModel} from '../../../models/models';

@Component({
  selector: 'signature-modal',
  templateUrl: 'signature-modal.html',
  providers: [WorkOrderService, SignatureService]
})
export class Signature extends BaseComponent {
  email: string;
  name: string;
  signatureForm: FormGroup;
  packedItems: PackedItem[];
  pendingItems: PackedItem[];
  workOrder: WorkOrderModel;
  allPickedAndPacked: boolean;
  blankCanvas: string;
  soId: any;

  constructor(public viewCtrl: ViewController, params: NavParams, private formBuilder: FormBuilder, private app: AppService,
    private workOrderService: WorkOrderService, private signatureService: SignatureService, loadingCtrl: LoadingController) {
    super(loadingCtrl);
    this.signatureForm = formBuilder.group({
      name: ['', Validators.required],
      email: ['', Validators.compose([Validators.maxLength(70), Validators.pattern('^[_A-Za-z0-9-\\+]+(\\.[_A-Za-z0-9-]+)*@[A-Za-z0-9-]+(\\.[A-Za-z0-9]+)*(\\.[A-Za-z]{2,})$'), Validators.required])]
    });
    this.packedItems = params.get('packedItems');
    this.pendingItems = params.get('pendingItems');
    this.workOrder = params.get('workOrder');
    this.allPickedAndPacked = params.get('allPickedAndPacked');
    this.name = params.get('gcName');
    this.email = params.get('gcEmail');
    this.soId = params.get('soId');
  }

  @ViewChild(SignaturePad) signaturePad: SignaturePad;

  private signaturePadOptions: Object = {
    'minWidth': 2,
    'canvasWidth': 310,
    'canvasHeight': 300
  };

  closeModal() {
    this.viewCtrl.dismiss();
  }

  completePackAndShip() {
    if (this.signatureForm.valid && this.signaturePad.toDataURL() != this.blankCanvas) {
      let data = this.signaturePad.toDataURL();
      this.presentLoading("Performing pack and ship operation...");
      let workOrderPackShipModel: any = { 
          workOrder: this.workOrder, 
          packedItems: this.packedItems, 
          pendingItems: this.pendingItems,
          isFullyPackedAndShipped: this.allPickedAndPacked,
          gcName: this.name,
          siteId: this.workOrder.SiteId,
          gcCompanyDescription: this.workOrder.GCCompanyDescription,
          gcEmail: this.email,
          soId: this.soId,
          signature: data.split(",")[1]
      };

      this.workOrderService.packAndShipOFWorkOrderItems(workOrderPackShipModel).then(
        () => {
          this.app.showToast("Pack and ship operation completed successfully.", "success");
          this.dismissLoading();
          this.viewCtrl.dismiss(data);
        },
        error => {
          this.dismissLoading();
          console.error(error);
          this.app.showErrorToast("An error occurred while performing pick operation. Please try again.");
        });
    } else {
      if (!this.signatureForm.get('name').valid) {
        this.app.showErrorToast("Please fill all the fields before submitting your signature.");
      } else if(this.signaturePad.toDataURL() == this.blankCanvas){
        this.app.showErrorToast("Please fill out the signature.");
      } else {
        this.app.showErrorToast("Please enter your email address correctly and try again.");
      }
    }
  }

  ngAfterViewInit() {
    this.signaturePad.set('minWidth', 2);
    this.signaturePad.clear();
    this.blankCanvas = this.signaturePad.toDataURL();
  }

  drawComplete() {
    //console.log(this.signaturePad.toDataURL());
    //console.log('Drawing complete');
  }

  drawStart() {
    //console.log('Drawing start');
  }

  clearSignature() {
    this.signaturePad.clear();
  }
}