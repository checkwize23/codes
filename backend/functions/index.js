import * as functions from 'firebase-functions';
import app from '../app.js';

// Cloud Function export
export const hire = functions.https.onRequest(app);
