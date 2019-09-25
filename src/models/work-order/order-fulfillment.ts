export class PickedItem {

    constructor() {

    }

    ItemIsLot:boolean;
    ItemIsSerial:boolean;
    Id:string;
    Uom:string;
    ItemNumber: string;
    QtyPick: number; 
    QtyOrdered: number; 
    LotsAndSerialNumbers: Map<string, string[]>;
    LotNumber: string ;
    InventoryItemLocations: InventoryItemLocation[];
    AllowedDecimals: number;
}

export class PackedItem {

    constructor() {

    }

    ItemLot:boolean;
    ItemIsSerial:boolean;
    SOLineId:string;
    LineNumber:number;
    Qty: number; 
    UOM: string; 
    originalQty: number; 
    ItemName: string;
    JobName: string;
}

export class InventoryItemLocation {
    constructor() {

    }
    LocationQty: number;
    Id: string;
    LocationId: string;
    LotNumber: string;
    LocationNumber: number;
    SerialNumbers: string[];
    PickSequence: number;
}