import * as fs from 'fs';
import BookingDetails from '../models/bookingSchema';
import ParkingSlotsSchema from '../models/parkingSlotsSchema';
import SlotsDetails from '../models/slotsSchema';
import * as moment from 'moment';
import {
    filePath
} from '../utils/constants';


export const cancelLateBooking = async () => {
    let data = fs.existsSync(filePath + "storage.json") ?
        JSON.parse(fs.readFileSync(filePath + "storage.json", "utf8")) :
        fs.appendFileSync(filePath + "storage.json", '[]');
    if (data) {
        await Promise.all(data.map(async element => {
            let waitingTime = moment(element.waitingTime);
            let duration = moment.duration(moment().diff(waitingTime));
            let minutes = duration.asMinutes();
            if (minutes > 0) {
                let bookingDetails: any = await BookingDetails.findOne({
                    _id: element._id
                });
                if (bookingDetails) {
                    if (bookingDetails.status === 'OPEN') {
                        await BookingDetails.updateOne({
                            _id: element._id
                        }, {
                            status: 'CANCELLED'
                        });
                        await ParkingSlotsSchema.updateOne({
                            slotNumber: bookingDetails.slotNumber
                        }, {
                            available: true
                        })
                        let slotDetails: any = await SlotsDetails.find();
                        slotDetails = slotDetails[0];
                        let slots = {};
                        if (bookingDetails.type === 'RESERVED') {
                            slots = {
                                reservedBookedSlots: slotDetails.reservedBookedSlots - 1,
                                reservedAvailableSlots: slotDetails.reservedAvailableSlots + 1
                            }
                        } else if (bookingDetails.type === 'GENERAL') {
                            slots = {
                                generalBookedSlots: slotDetails.generalBookedSlots - 1,
                                generalAvailableSlots: slotDetails.generalAvailableSlots + 1
                            }
                        }
                        await SlotsDetails.updateOne({
                            _id: slotDetails._id
                        }, slots);
                        await removeData(element._id, data);
                    } else {
                        await removeData(element._id, data);
                    }
                } else {
                    await removeData(element._id, data);
                }
            }
        }));
    } else {
        console.log('no data found');
    }
};

const removeData = async (_id, data) => {
    let filtered = data.filter(function (value) {
        return value._id != _id;
    });
    fs.writeFileSync(filePath + "storage.json", JSON.stringify(filtered, null, 2));
    return true;
}