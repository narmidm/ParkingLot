import {
    Schema
} from 'mongoose';
import * as mongoose from 'mongoose';

const slotsDetailsSchema = new Schema({
    _id: {
        type: String
    },
    generalBookedSlots: {
        type: Number,
        required: true
    },
    generalAvailableSlots: {
        type: Number,
        required: true
    },
    reservedBookedSlots: {
        type: Number,
        required: true
    },
    reservedAvailableSlots: {
        type: Number,
        required: true
    },
    nextReservedAvailableSlots: {
        type: Number,
        required: true
    },
    nextGeneralAvailableSlots: {
        type: Number,
        required: true
    },
});

export default mongoose.model('SlotsDetails', slotsDetailsSchema);