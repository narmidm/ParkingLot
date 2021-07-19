import {
    Request,
    Response,
    Next
} from 'express';
import UserDetails from '../models/userSchema';
import * as uuid from 'uuid';

export const registerUser = async (req: Request, res: Response, next: Next) => {
    try {
        let data = req.body;
        let user = {
            _id: uuid.v4(),
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            email: data.email ? data.email : null,
            differentlyAbled: data.differentlyAbled ? data.differentlyAbled : false,
            pregnantWomen: data.pregnantWomen ? data.pregnantWomen : false
        }
        let userDetail: any = await UserDetails.findOne({
            phone: data.phone,
            email: data.email
        });
        if (userDetail) {
            res.statusCode = 403;
            res.json({
                Response: 'user already registered'
            })
            return next();
        } else {
            let userInfo = new UserDetails(user);
            userDetail = await userInfo.save();
            res.statusCode = 200;
            res.json({
                Response: {
                    message: 'user successfully registered',
                    id: userDetail._id
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

export const getAllUsers = async (req: Request, res: Response, next: Next) => {
    try {
        let userDetail: any = await UserDetails.find();
        if (!userDetail) {
            res.statusCode = 404;
            res.json({
                Response: 'no user found'
            })
            return next();
        } else {
            res.statusCode = 200;
            res.json({
                Response: {
                    message: 'user successfully retrieved',
                    data: userDetail
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