import {
    Request,
    Response,
    Next
} from 'express';
import BookingDetails from '../models/bookingSchema';
import * as moment from 'moment';

export const entry = async (req: Request, res: Response, next: Next) => {
    try {
        let bookingId = req.params.bookingId;
        let bookingDetails: any = await BookingDetails.findOne({
            _id: bookingId
        });
        if (bookingDetails) {
            if (bookingDetails.status === 'ACTIVE') {
                res.statusCode = 200;
                res.json({
                    Response: 'Booking is still active'
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
                let startTime = moment(bookingDetails.startTime);
                let duration = moment.duration(startTime.diff(moment()));
                let minutes = duration.asMinutes();
                console.log(minutes);
                if (minutes > 0) {
                    res.statusCode = 200;
                    res.json({
                        Response: 'you are before time , come back after ' + Math.ceil(minutes) + ' minutes'
                    })
                    return next();
                }
                await BookingDetails.updateOne({
                    _id: bookingId
                }, {
                    status: 'ACTIVE'
                });
                res.statusCode = 200;
                res.json({
                    Response: 'Entry successfull , have a nice day !'
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