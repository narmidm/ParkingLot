import {
    Schema
} from 'mongoose';
import * as mongoose from 'mongoose';

const bookingDetailsSchema = new Schema({
    _id: {
        type: String
    },
    userId: {
        type: String,
        require: true
    },
    slotNumber: {
        type: String,
        require: true
    },
    type: {
        type: String,
        require: true,
        enum: ['GENERAL', 'RESERVED']
    },
    vehicleNumber: {
        type: String,
        required: true
    },
    vehicleColor: {
        type: String,
        require: true
    },
    bookingTime: {
        type: String,
        require: true
    },
    startTime: {
        type: String,
        require: true
    },
    endTime: {
        type: String
    },
    waitingTime: {
        type: String,
        require: true
    },
    status: {
        type: String,
        enum: ['OPEN', 'ACTIVE', 'CANCELLED', 'COMPLETED'],
        require: true
    }
});

export default mongoose.model('BookingDetails', bookingDetailsSchema);