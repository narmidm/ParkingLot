import {
    Request,
    Response,
    Next
} from 'express';
import * as uuid from 'uuid';
import * as moment from 'moment';
import UserDetails from '../models/userSchema';
import SlotsDetails from '../models/slotsSchema';
import BookingDetails from '../models/bookingSchema';

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
        let nextReservedAvailableSlots;
        let nextGeneralAvailableSlots;

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
                    slotNumber = slotDetails.nextGeneralAvailableSlots;
                    generalBookedSlots = slotDetails.generalBookedSlots + 1;
                    generalAvailableSlots = slotDetails.generalAvailableSlots - 1;
                    if (slotDetails.nextGeneralAvailableSlots < 96) {
                        nextGeneralAvailableSlots = slotDetails.nextGeneralAvailableSlots + 1
                    }
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
                    slotNumber = slotDetails.nextReservedAvailableSlots;
                    reservedBookedSlots = slotDetails.reservedBookedSlots + 1;
                    reservedAvailableSlots = slotDetails.reservedAvailableSlots - 1;
                    if (slotDetails.nextReservedAvailableSlots < 24) {
                        nextReservedAvailableSlots = slotDetails.nextReservedAvailableSlots + 1
                    }
                } else if (slotDetails.generalAvailableSlots > 0) {
                    slotNumber = slotDetails.nextGeneralAvailableSlots;
                    generalBookedSlots = slotDetails.generalBookedSlots + 1;
                    generalAvailableSlots = slotDetails.generalAvailableSlots - 1;
                    if (slotDetails.nextGeneralAvailableSlots < 96) {
                        nextGeneralAvailableSlots = slotDetails.nextGeneralAvailableSlots + 1
                    }
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
                reservedAvailableSlots: reservedAvailableSlots >= 0 ? reservedAvailableSlots : slotDetails.reservedAvailableSlots,
                nextReservedAvailableSlots: nextReservedAvailableSlots >= 0 ? nextReservedAvailableSlots : slotDetails.nextReservedAvailableSlots,
                nextGeneralAvailableSlots: nextGeneralAvailableSlots >= 0 ? nextGeneralAvailableSlots : slotDetails.nextGeneralAvailableSlots
            };
            await SlotsDetails.updateOne({
                _id: slotDetails._id
            }, slots);


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
            res.statusCode = 200;
            res.json({
                Response: {
                    message: userDetail.firstName + ' you successfully booked your parking slot and your slot number is ' + booking.slotNumber,
                    data: {
                        bookingId: booking._id,
                        vehicleNumber: booking.vehicleNumber,
                        startTime: booking.startTime,
                        waitingTime: booking.waitingTime,
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
            $or: [{status: 'OPEN'},
            {status: 'ACTIVE'}]
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