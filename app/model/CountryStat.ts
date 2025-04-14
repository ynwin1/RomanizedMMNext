import mongoose, { Schema, Model, models } from "mongoose";

export interface ICountryStat {
    country: string;
    code: string;
    count: number;
}

const CountryStatSchema: Schema<ICountryStat> = new Schema({
    country: { type: String, required: true, unique: true },
    code: { type: String, required: true },
    count: { type: Number, required: true },
});

const CountryStat: Model<ICountryStat> = models.CountryStat || mongoose.model<ICountryStat>("CountryStat", CountryStatSchema);

export default CountryStat;