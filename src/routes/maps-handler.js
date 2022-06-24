require('dotenv').config({ path: '.env' });

const MedicalInfo = require('../models/medicalInfo');

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
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=hospital+health&location=${lat},${lng}&radius=50000&key=${key}`;
    const response = await axios.get(url);

    var nextPageToken = response.data.next_page_token;

    while (nextPageToken) {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${nextPageToken}&key=${key}`;
      const newResponse = await axios.get(url);
      nextPageToken = newResponse.data.next_page_token;
      response.data.results = response.data.results.concat(
        newResponse.data.results
      );
    }

    delete response.data.next_page_token;
    delete response.data.html_attributions;
    delete response.data.status;

    const specialties = await MedicalInfo.findAll({
      attributes: ['name'],
      where: {
        type: 'speciality',
      },
    });

    const specialtiesList = specialties.map((speciality) => {
      return speciality.name;
    });

    const diseases = await MedicalInfo.findAll({
      attributes: ['name'],
      where: {
        type: 'disease',
      },
    });

    const diseasesList = diseases.map((disease) => {
      return disease.name;
    });

    // Convert the response to a list of hospital objects
    response.data.results = response.data.results.map((result) => {
      return {
        name: result.name,
        address: result.vicinity,
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
        beds: {
          totalBeds: Math.floor(Math.random() * 500),
          availableBeds: Math.floor(Math.random() * 500),
        },
        specialties: [
          {
            name: specialtiesList[
              Math.floor(Math.random() * specialtiesList.length)
            ],
            number: Math.floor(Math.random() * 200),
          },
          {
            name: specialtiesList[
              Math.floor(Math.random() * specialtiesList.length)
            ],
            number: Math.floor(Math.random() * 200),
          },
          {
            name: specialtiesList[
              Math.floor(Math.random() * specialtiesList.length)
            ],
            number: Math.floor(Math.random() * 200),
          },
          {
            name: specialtiesList[
              Math.floor(Math.random() * specialtiesList.length)
            ],
            number: Math.floor(Math.random() * 200),
          },
          {
            name: specialtiesList[
              Math.floor(Math.random() * specialtiesList.length)
            ],
            number: Math.floor(Math.random() * 200),
          },
          {
            name: specialtiesList[
              Math.floor(Math.random() * specialtiesList.length)
            ],
            number: Math.floor(Math.random() * 200),
          },
        ],
        diseases: [
          {
            name: diseasesList[
              Math.floor(Math.random() * specialtiesList.length)
            ],
            number: Math.floor(Math.random() * 1000),
          },
          {
            name: diseasesList[
              Math.floor(Math.random() * specialtiesList.length)
            ],
            number: Math.floor(Math.random() * 1000),
          },
          {
            name: diseasesList[
              Math.floor(Math.random() * specialtiesList.length)
            ],
            number: Math.floor(Math.random() * 1000),
          },
          {
            name: diseasesList[
              Math.floor(Math.random() * specialtiesList.length)
            ],
            number: Math.floor(Math.random() * 1000),
          },
          {
            name: diseasesList[
              Math.floor(Math.random() * specialtiesList.length)
            ],
            number: Math.floor(Math.random() * 1000),
          },
        ],
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
