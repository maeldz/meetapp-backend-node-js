import * as Yup from "yup";
import { Op } from "sequelize";
import Meetup from "../models/Meetup";
import User from "../models/User";
import File from "../models/File";
import {
  startOfHour,
  startOfDay,
  endOfDay,
  parseISO,
  isBefore
} from "date-fns";

class MeetupController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const searchDate = parseISO(req.query.date);

    const meetups = await Meetup.findAll({
      where: {
        date: {
          [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)]
        }
      },
      attributes: [
        "id",
        "user_id",
        "date",
        "title",
        "description",
        "location",
        "past"
      ],
      include: [
        {
          model: User,
          attributes: ["name", "email"]
        }
      ],
      limit: 10,
      offset: (page - 1) * 10
    });

    return res.json(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
      banner_id: Yup.number().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: "Validation fails" });
    }

    const { title, description, location, date, banner_id } = req.body;

    // Check if banner exists

    const banner = await File.findByPk(banner_id);

    if (!banner) {
      return res.status(400).json({ error: "The banner does not exist" });
    }

    // Check for past dates

    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: "Past dates are not permitted" });
    }

    const meetup = await Meetup.create({
      user_id: req.userId,
      title,
      description,
      location,
      date,
      banner_id
    });

    return res.json({
      user_id: meetup.user_id,
      title,
      description,
      location,
      date,
      banner_id
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      description: Yup.string(),
      location: Yup.string(),
      date: Yup.date(),
      banner_id: Yup.number()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: "Validation fails" });
    }

    // Check for past dates

    const hourStart = startOfHour(parseISO(req.body.date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: "Can't update past meetups" });
    }

    // Check if meetup exist

    const meetup = await Meetup.findByPk(req.params.id);

    if (!meetup) {
      return res.status(400).json({ error: "Meetup doesn't exist" });
    }

    // Check if user is meetup organizer

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({ error: "User is not meetup organizer" });
    }

    const {
      id,
      user_id,
      title,
      description,
      location,
      date,
      banner_id
    } = await meetup.update(req.body);

    return res.json({
      id,
      user_id,
      title,
      description,
      location,
      date,
      banner_id
    });
  }

  async delete(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);

    // Check if user is meetup organizer

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({ error: "User is not meetup organizer" });
    }

    // Check if meetup is cancelable

    if (meetup.past) {
      return res.status(401).json({ error: "Meetup is not cancelable" });
    }

    const removeMeetup = await meetup.destroy();
    return res.json(removeMeetup);
  }
}

export default new MeetupController();
