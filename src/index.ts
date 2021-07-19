/* ------ Module Imports ------ */
import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as _http from 'http';
import * as mongoose from 'mongoose';
import * as cron from 'node-cron';

/* ------ Constants Imports ------ */
import { dbURI } from './utils/constants';
import { registerUser, getAllUsers } from './controllers/userController';
import { newBooking, getBookings } from './controllers/bookingController';
import { entry } from './controllers/entryController';
import { exit } from './controllers/exitController';
import { getAvailableSlot, getBookedSlots } from './controllers/slotController';
import { cancelLateBooking } from './services/autoCheckBooking';

/* ------ Declaration Of Global Variable ------ */
const dbUri = dbURI;


class App {
    public express: express.Application;

    constructor() {
        this.express = express();
        this.middleware();
        this.routes();
        this.launchConf();
    }

    public middleware(): void {
        this.express.set("port", 4000);
        this.express.use(cors());
        this.express.use(bodyParser.urlencoded({ extended: false }));
        this.express.use(bodyParser.json());
        this.express.options('*', cors());
    }

    public routes(): void {
        this.express.post('/user/register', registerUser);
        this.express.get('/users', getAllUsers);
        this.express.post('/booking', newBooking);
        this.express.get('/bookings', getBookings);
        this.express.get('/entry/:bookingId', entry);
        this.express.get('/exit/:bookingId', exit);
        this.express.get('/getavailableslot', getAvailableSlot);
        this.express.get('/getbookedslots', getBookedSlots);
    }

    public async launchConf() {
        const http = _http.createServer(this.express);
        try {
            let connection = await mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true });
            if (mongoose.connection.readyState === 1) {
                console.log('Connected To Database!');
            }
            cron.schedule("0 */1 * * * *", function () {
                console.log("running a cancellation task every 1 minute");
                cancelLateBooking();
            });
        } catch (err) {
            console.error(err);
            console.log('Error COnnecting To Database!');
        }
        http.listen(this.express.get("port"), () => {
            console.log('Listening on PORT: ', this.express.get("port"));
        });
    }
}
export default new App().express;