export class PowaLine {
    POLineNumber: number;
    POItem: string;
    POLineDescription: string;
    POLineStatus: string;
    RSTKPOLineQty: number;
    POTotal: string;
  
    clone(): PowaLine {
      return Object.assign(new PowaLine(), this);
    }
  
  }