export class User {
    UserId: string;
    UserSid: number;
    UserName: string;
    UserEmail: string;
    UserType: string;
    UserTypeId: number;
}

export enum UserTypes{
    OFAssociate = 25,
    OFManager = 24,
    PM = 11,
    PC = 6,
    Admin = 9,
    GC = 8
}