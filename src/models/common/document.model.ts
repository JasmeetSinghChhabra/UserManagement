export class DocumentModel {

    constructor() {
  
    }
    
    DocumentId: string;
    DocumentName: string;
    Id: number;
    FileName: string;
    Shared: string;
    JobNumber: string;
    MimeType: string;
    Extension: string;
    ImageSrc: any;
    IsViewable: boolean;
    IsPicture: boolean;

    clone(): DocumentModel {
      return Object.assign(new DocumentModel(), this);
    }

  }