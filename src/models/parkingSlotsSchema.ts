import {
    Schema
} from 'mongoose';
import * as mongoose from 'mongoose';

const parkingSlotsSchema = new Schema({
    slotNumber: {
        type: String,
        require: true
    },
    type: {
        type: String,
        require: true,
        enum: ['GENERAL', 'RESERVED']
    },
    available: {
        type: Boolean,
        require: true
    }
});

export default mongoose.model('ParkingSlots', parkingSlotsSchema);