import {
    Schema
} from 'mongoose';
import * as mongoose from 'mongoose';

const parkingDetailsSchema = new Schema({
    _id: {
        type: String
    },

});

export default mongoose.model('ParkingDetails', parkingDetailsSchema);