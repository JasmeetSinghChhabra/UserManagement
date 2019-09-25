export class VQAItem {
    Name: string;
    Childs: VQAItem[];
    Status: string;
    Description: string;
    JobApplicableActionSID: number;
    ApprovedItems: number;
    RejectedItems: number;
    UploadedItems: number;
    PendingItems: number;
    TotalItems: number;
}

export class VQAUploadedVideo {
    FileName: string;
    FileType: string;
    LastModifiedDate: Date;
    LastModifiedUserId: string;
    Status: string;
    StatusComment: string;
    VideoChecklistJobUploadsSID: number;
    MediaFileSID: number;
    Thumbnail: string;
    UploadProgress: number;
}

export enum VQAStatus{
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    Uploaded = 3
}

export enum VQAStatusBE{
    Pending = "Pending",
    Approved = "Approved",
    Rejected = "Rejected",
    Uploaded = "Pending Approval"
}
