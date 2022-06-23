require('dotenv').config({ path: '.env' });

const passport = require('passport');
const axios = require('axios');

const { GOOGLE_API_KEY: key } = process.env;

/**
 * @openapi
 * /maps/nearby-hospitals:
 *   post:
 *     summary: Retrieves a list of nearby hospitals based on the user's coordinates.
 *     tags:
 *       - "Maps"
 *     operationId: maps_nearby_hospitals
 *     x-eov-operation-handler: maps-handler
 *
 *     requestBody:
 *       description: The request body
 *       content:
 *         "application/json":
 *           schema:
 *             type: object
 *             required:
 *               - lat
 *               - lng
 *
 *             properties:
 *               lat:
 *                 type: string
 *                 example: "40.7128"
 *               lng:
 *                 type: string
 *                 example: "-74.0060"
 *
 *     responses:
 *       '200':
 *         description: "Hospital list"
 *       '401':
 *         description: "Unauthorized"
 *       '400':
 *         description: "Invalid data"
 *     security:
 *        - JWT: []
 *        - {}
 */
module.exports.maps_nearby_hospitals = [
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    const { lat, lng } = req.body;
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50000&type=hospital&key=${key}`;
    const response = await axios.get(url);

    var nextPageToken = response.data.next_page_token;

    while (nextPageToken) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${nextPageToken}&key=${key}`;
      const newResponse = await axios.get(url);
      nextPageToken = newResponse.data.next_page_token;
      response.data.results = response.data.results.concat(
        newResponse.data.results
      );
    }

    // Convert the response to a list of hospital objects
    response.data.results = response.data.results.map((result) => {
      return {
        name: result.name,
        address: result.vicinity,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        status: result.business_status,
      };
    });

    if (response.status == 200) {
      res.status(200).json(response.data);
    } else {
      res.status(400).json({ error: 'Error while fetching hospitals data' });
    }
  },
];
