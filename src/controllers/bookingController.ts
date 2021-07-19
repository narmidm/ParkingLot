import {
    Request,
    Response,
    Next
} from 'express';
import * as uuid from 'uuid';
import * as moment from 'moment';
import * as fs from 'fs';
import UserDetails from '../models/userSchema';
import SlotsDetails from '../models/slotsSchema';
import BookingDetails from '../models/bookingSchema';
import ParkingSlotsSchema from '../models/parkingSlotsSchema';
import {
    filePath
} from '../utils/constants';

export const newBooking = async (req: Request, res: Response, next: Next) => {
    try {
        let data = req.body;
        let type = data.type;
        let startTime = data.startTime;
        let slotNumber;
        let waitingTime;
        let generalBookedSlots;
        let generalAvailableSlots;
        let reservedBookedSlots;
        let reservedAvailableSlots;

        let userDetail: any = await UserDetails.findOne({
            _id: data.userId
        });
        if (userDetail) {
            const startTimeConverted = moment(startTime, 'HH:mm:ss');
            let duration = moment.duration(startTimeConverted.diff(moment()));
            let minutes = duration.asMinutes();
            if (minutes < 15) {
                res.statusCode = 200;
                res.json({
                    Response: {
                        message: 'sorry!! please book 15 minutes prior to arrival',
                    }
                });
                return next();
            }
            waitingTime = startTimeConverted.clone();
            let slotDetails: any = await SlotsDetails.find();
            slotDetails = slotDetails[0];
            if ((slotDetails.generalBookedSlots + slotDetails.reservedBookedSlots) > 60) {
                waitingTime = waitingTime.add(15, 'minutes');
            } else {
                waitingTime = waitingTime.add(30, 'minutes');
            }
            if (type === 'GENERAL') {
                if (slotDetails.generalAvailableSlots > 0) {
                    slotNumber = await getNextGeneralSlot();
                    generalBookedSlots = slotDetails.generalBookedSlots + 1;
                    generalAvailableSlots = slotDetails.generalAvailableSlots - 1;
                } else {
                    res.statusCode = 200;
                    res.json({
                        Response: {
                            message: 'sorry but all slots are booked',
                        }
                    })
                    return next();
                }
            } else if (type === 'RESERVED') {
                if (slotDetails.reservedAvailableSlots > 0) {
                    slotNumber = await getNextReservedSlot();
                    reservedBookedSlots = slotDetails.reservedBookedSlots + 1;
                    reservedAvailableSlots = slotDetails.reservedAvailableSlots - 1;
                } else if (slotDetails.generalAvailableSlots > 0) {
                    slotNumber = await getNextGeneralSlot();
                    generalBookedSlots = slotDetails.generalBookedSlots + 1;
                    generalAvailableSlots = slotDetails.generalAvailableSlots - 1;
                } else {
                    res.statusCode = 200;
                    res.json({
                        Response: {
                            message: 'sorry but all slots are booked',
                        }
                    })
                    return next();
                }
            } else {
                res.statusCode = 404;
                res.json({
                    Response: {
                        message: 'wrong type',
                    }
                })
                return next();
            }
            let slots = {
                generalBookedSlots: generalBookedSlots >= 0 ? generalBookedSlots : slotDetails.generalBookedSlots,
                generalAvailableSlots: generalAvailableSlots >= 0 ? generalAvailableSlots : slotDetails.generalAvailableSlots,
                reservedBookedSlots: reservedBookedSlots >= 0 ? reservedBookedSlots : slotDetails.reservedBookedSlots,
                reservedAvailableSlots: reservedAvailableSlots >= 0 ? reservedAvailableSlots : slotDetails.reservedAvailableSlots
            };
            await SlotsDetails.updateOne({
                _id: slotDetails._id
            }, slots);

            await ParkingSlotsSchema.updateOne({
                slotNumber: slotNumber
            }, {
                available: false
            })

            let booking = {
                _id: uuid.v4(),
                userId: data.userId,
                type: data.type,
                vehicleNumber: data.vehicleNumber,
                vehicleColor: data.vehicleColor,
                bookingTime: moment(),
                startTime: startTimeConverted,
                endTime: null,
                waitingTime: waitingTime,
                slotNumber: slotNumber,
                status: 'OPEN'
            }
            await new BookingDetails(booking).save();
            await saveDataOnFile(booking);
            res.statusCode = 200;
            res.json({
                Response: {
                    message: userDetail.firstName + ' you successfully booked your parking slot and your slot number is ' + booking.slotNumber,
                    data: {
                        bookingId: booking._id,
                        vehicleNumber: booking.vehicleNumber,
                        startTime: booking.startTime.toString(),
                        waitingTime: booking.waitingTime.toString(),
                        slotNumber: booking.slotNumber
                    }
                }
            })
            return next();
        } else {
            res.statusCode = 404;
            res.json({
                Response: {
                    message: 'user is not registered',
                }
            })
            return next();
        }
    } catch (err) {
        res.statusCode = 500;
        res.json({
            error: {
                message: 'something went wrong',
                error: err
            }
        })
        return next();
    }
}

export const getBookings = async (req: Request, res: Response, next: Next) => {
    try {
        let bookingDetail: any = await BookingDetails.find({
            $or: [{
                status: 'OPEN'
            },
            {
                status: 'ACTIVE'
            }
            ]
        });
        if (!bookingDetail) {
            res.statusCode = 404;
            res.json({
                Response: 'no bookings found'
            })
            return next();
        } else {
            res.statusCode = 200;
            res.json({
                Response: {
                    message: 'bookings successfully retrieved',
                    data: bookingDetail
                }
            })
            return next();
        }
    } catch (err) {
        res.statusCode = 500;
        res.json({
            error: {
                message: 'something went wrong',
                error: err
            }
        })
        return next();
    }
}

const saveDataOnFile = async (booking) => {
    let obj = {
        _id: booking._id,
        waitingTime: booking.waitingTime.toString(),
        status: booking.status
    }
    let data = fs.existsSync(filePath + "storage.json") ?
        JSON.parse(fs.readFileSync(filePath + "storage.json", "utf8")) :
        fs.appendFileSync(filePath + "storage.json", JSON.stringify([obj]));
    if (data) {
        data.push(obj);
        fs.writeFileSync(filePath + "storage.json", JSON.stringify(data, null, 2));
    } else {
        console.log('no data found');
    }
}

const getNextReservedSlot = async () => {
    let parkingSlot: any = await ParkingSlotsSchema.findOne({
        type: 'RESERVED',
        available: true
    });
    if (parkingSlot) {
        return parkingSlot.slotNumber;
    }
}

const getNextGeneralSlot = async () => {
    let parkingSlot: any = await ParkingSlotsSchema.findOne({
        type: 'GENERAL',
        available: true
    });
    if (parkingSlot) {
        return parkingSlot.slotNumber;
    }
}