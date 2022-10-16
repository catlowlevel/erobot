import { getModelForClass, prop } from "@typegoose/typegoose";
import { Document } from "mongoose";

class BimaUser {
    @prop({ type: String, unique: true, required: true })
    public jidPlusId!: string;

    @prop({ type: String, required: true })
    public jid!: string;

    @prop({ type: Number })
    public profileTime!: number;
    @prop({ type: String })
    public secretKey!: string;
    @prop({ type: String })
    public subscriberType!: string;
    @prop({ type: String })
    public language!: string;
    @prop({ type: String })
    public accessToken!: string;
    @prop({ type: String })
    public appsflyerMsisdn!: string;
    @prop({ type: String })
    public callPlan!: string;
    @prop({ type: String })
    public balance!: string;
    @prop({ type: String })
    public creditLimit!: string;
    @prop({ type: String })
    public msisdn!: string;
    @prop({ type: String })
    public profileColor!: string;
    @prop({ type: Boolean })
    public status!: true;
}

export type TBimaModel = BimaUser & Document;

export const bimaModel = getModelForClass(BimaUser);
