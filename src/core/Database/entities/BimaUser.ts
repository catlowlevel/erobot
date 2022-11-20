import { BaseEntity, Column, Entity, ObjectID, ObjectIdColumn } from "typeorm";
import { LoginData } from "../../../lib/bimatri/types";

@Entity()
export class BimaUser extends BaseEntity implements LoginData {
    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    jid: string;

    @Column("number")
    profileTime: number;
    @Column()
    secretKey: string;
    @Column()
    subscriberType: string;
    @Column()
    language: string;
    @Column()
    accessToken: string;
    appsflyerMsisdn: string;
    @Column()
    callPlan: string;
    @Column()
    balance: string;
    @Column()
    creditLimit: string;
    @Column()
    msisdn: string;
    profileColor: string;

    status: true;
}
