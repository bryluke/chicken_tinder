/* eslint-disable class-methods-use-this */
import dotenv from 'dotenv';
import { resolve } from 'path';
import axios from 'axios';

// Initialize dotenv to pull secrets for salting process
dotenv.config();

class MatchCtrl {
  constructor(name, model, db) {
    this.name = name;
    this.model = model;
    this.db = db;
  }

  async createSession(req, res) {
    console.log('POST Request: /match');
    console.log('req.body', req.body);
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

    // Destructure params from front end
    const {
      currentUserId, partner, coordinates, cuisine, dateTime, price, radius,
    } = req.body;
    const { lat, lng } = coordinates;

    const userId = Number(currentUserId);
    const partnerUserId = Number(partner);

    // Get URL request to google for nearby places Data
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${apiKey}&location=${lat},${lng}&radius=${radius}&type=restaurant&keyword=${cuisine}`;

    const response = await axios.get(url);

    const searchResults = response.data;

    const likesList = [];

    const newSession = await this.model.create({
      p1Id: userId,
      p2Id: partnerUserId,
      // eslint-disable-next-line quote-props
      parameters: {
        url, cuisine, dateTime, price,
      },
      searchResults,
      likesList,
    });

    res.status(200).send({ newSession });
  }

  async findSession(req, res) {
    console.log('GET Request: /match/session/:sessionId');
    console.log('req params', req.params);

    try {
      // sessionId is a string
      const sessionPk = Number(req.params.sessionId);

      // Find session in match table by pk
      const existingSession = await this.model.findByPk(sessionPk);

      console.log('found exisitng session?', existingSession);

      res.status(200).json({ existingSession });
    } catch (err) { console.log(err); }
  }

  async swipeUpdate(req, res) {
    console.log('POST Request: /match/swipe');
    console.log('<------swipe update------>');
    // Request.body = {restaurant_ID: integer, playerID, player1/player2 }
    const {
      restaurantId,
      userId,
      p1Id,
      p2Id,
      sessionId,
    } = req.body;

    const currentSession = await this.model.findByPk(sessionId);
    const { likesList: updatedLikesList } = currentSession;
    console.log('+++++++++++++++ current session likes list +++++++++++++++', updatedLikesList);

    // >>>>>> NEW likesList format <<<<<< //
    // [{
    // restaurant_id: blah-blah-numbers,
    // likes: [p1Id, p2Id],
    // dislikes: []
    // }]

    if (updatedLikesList.length === 0) {
      updatedLikesList.push({
        restaurant_id: restaurantId,
        likes: [userId],
        dislikes: [],
      });
      const updatedSession = await currentSession.update({ updatedLikesList });
      console.log('OOOOOOOOOOO LIKES LIST UPDATED OOOOOOOOOO');
      return res.status(200).json({ updatedSession });
    }

    // If restaurant is already in like list
    for (let i = 0; i < updatedLikesList.length; i += 1) {
      if (updatedLikesList[i].restaurant_id === restaurantId) {
        updatedLikesList.likes.push(userId);
        if (updatedLikesList.likes.length === 2) {
          console.log('////// MATCH /////');
          return res.status(200).json({ match: true });
        } if (updatedLikesList.likes.length < 2) {
          console.log('<=== NO MATCH ===>');
          return res.status(200).json({ match: false });
        }
      }
    }
    // else if restaurant is not yet in likes list
    updatedLikesList.push({
      restaurant_id: restaurantId,
      likes: [userId],
      dislikes: [],
    });
    const updatedSession = await currentSession.update({ likesList: updatedLikesList },
      { where: { id: sessionId } });
    console.log('OOOOOOOOOOO LIKES LIST UPDATED OOOOOOOOOO');
    return res.status(200).json({ updatedSession });
  }
}

export default MatchCtrl;
