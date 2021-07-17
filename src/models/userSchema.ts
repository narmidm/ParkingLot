import {
    Schema
} from 'mongoose';
import * as mongoose from 'mongoose';

const userDetailsSchema = new Schema({
    _id: {
        type: String
    },
    firstName: {
        type: String,
        require: true
    },
    lastName: {
        type: String,
        require: true
    },
    phone: {
        type: Number,
        require: true,
        maxlength: 10,
        minlength: 10

    },
    email: {
        type: String,
        required: false,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    },
    differentlyAbled: {
        type: Boolean
    },
    pregnantWomen: {
        type: Boolean
    }
});

export default mongoose.model('UserDetails', userDetailsSchema);