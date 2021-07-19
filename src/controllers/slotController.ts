import {
    Request,
    Response,
    Next
} from 'express';
import SlotDetails from '../models/slotsSchema';
import ParkingSlotsSchema from '../models/parkingSlotsSchema';

export const getAvailableSlot = async (req: Request, res: Response, next: Next) => {
    try {
        let slotDetails: any = await SlotDetails.find();
        let parkingSlotsDetails: any = await ParkingSlotsSchema.find({
            available: true
        });
        if (!parkingSlotsDetails) {
            res.statusCode = 404;
            res.json({
                Response: 'no data found'
            })
            return next();
        } else {
            res.statusCode = 200;
            res.json({
                Response: {
                    message: 'Available slot details successfully retrieved',
                    data: {
                        countDetails: slotDetails,
                        parkingData: parkingSlotsDetails
                    }
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
};

export const getBookedSlots = async (req: Request, res: Response, next: Next) => {
    try {
        let slotDetails: any = await SlotDetails.find();
        let parkingSlotsDetails: any = await ParkingSlotsSchema.find({
            available: false
        });
        if (!parkingSlotsDetails) {
            res.statusCode = 404;
            res.json({
                Response: 'no data found'
            })
            return next();
        } else {
            res.statusCode = 200;
            res.json({
                Response: {
                    message: 'Booked slot details successfully retrieved',
                    data: {
                        countDetails: slotDetails,
                        parkingData: parkingSlotsDetails
                    }
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
};