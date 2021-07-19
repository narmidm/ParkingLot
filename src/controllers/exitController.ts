import {
    Request,
    Response,
    Next
} from 'express';
import BookingDetails from '../models/bookingSchema';
import ParkingSlotsSchema from '../models/parkingSlotsSchema';
import SlotsDetails from '../models/slotsSchema';
import * as moment from 'moment';

export const exit = async (req: Request, res: Response, next: Next) => {
    try {
        let bookingId = req.params.bookingId;
        let bookingDetails: any = await BookingDetails.findOne({
            _id: bookingId
        });
        if (bookingDetails) {
            if (bookingDetails.status === 'ACTIVE') {
                let currentTime = moment().format();
                await BookingDetails.updateOne({
                    _id: bookingId
                }, {
                    status: 'COMPLETED',
                    endTime: currentTime
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
                res.statusCode = 200;
                res.json({
                    Response: 'Exit successfull , have a nice day !'
                })
                return next();
            } else if (bookingDetails.status === 'CANCELLED') {
                res.statusCode = 200;
                res.json({
                    Response: 'Booking is cancelled due to late arrival'
                })
                return next();
            } else if (bookingDetails.status === 'COMPLETED') {
                res.statusCode = 200;
                res.json({
                    Response: 'Booking is already completed'
                })
                return next();
            } else if (bookingDetails.status === 'OPEN') {
                res.statusCode = 200;
                res.json({
                    Response: 'Vehicle in not entered in the parking yet, first entry your vehicle'
                })
                return next();
            }
        } else {
            res.statusCode = 404;
            res.json({
                Response: 'No booking find for this Id'
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
};