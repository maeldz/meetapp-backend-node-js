import { Op } from "sequelize";
import Subscription from "../models/Subscription";
import Meetup from "../models/Meetup";
import User from "../models/User";

import SubscriptionMail from "../jobs/SubscriptionMail";
import Queue from "../../lib/Queue";

class SubscriptionController {
  async index(req, res) {
    const subscriptions = await Subscription.findAll({
      where: {
        user_id: req.userId
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: {
              [Op.gt]: new Date()
            }
          }
        }
      ],
      order: [[Meetup, "date", "ASC"]]
    });

    return res.json(subscriptions);
  }

  async store(req, res) {
    const meetup = await Meetup.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ["name", "email"]
        }
      ]
    });

    // Check if meetup exist

    if (!meetup) {
      return res.status(400).json({ error: "Meetup don't exists" });
    }

    // Check if user is meetup organizer

    if (meetup.user_id === req.userId) {
      return res
        .status(401)
        .json({ error: "User can't subscribe to a meetup that he organizes" });
    }

    // Check for past meetup

    if (meetup.past) {
      return res.status(401).json({ error: "Can't subscribe to past meetups" });
    }

    // Check if the user is already subscribed to meetup

    const checkSubscribed = await Subscription.findOne({
      where: {
        user_id: req.userId,
        meetup_id: meetup.id
      }
    });

    if (checkSubscribed) {
      return res
        .status(401)
        .json({ error: "User is already subscribed to this meetup" });
    }

    // Check if the user is already subscribed to a meetup at this time

    const checkDate = await Subscription.findOne({
      where: {
        user_id: req.userId
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetup.date
          }
        }
      ]
    });

    if (checkDate) {
      return res
        .status(401)
        .json({ error: "Can't subscribe to two meetups at the same time" });
    }

    const { id, meetup_id, user_id } = await Subscription.create({
      meetup_id: req.params.id,
      user_id: req.userId
    });

    const { name: subscriberName } = await User.findByPk(req.userId);

    await Queue.add(SubscriptionMail.key, {
      organizerName: meetup.User.name,
      organizerEmail: meetup.User.email,
      meetupTitle: meetup.title,
      subscriberName
    });

    return res.json({ id, meetup_id: Number(meetup_id), user_id });
  }
}

export default new SubscriptionController();
