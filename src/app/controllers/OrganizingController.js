import { Op } from "sequelize";

import Meetup from "../models/Meetup";
import File from "../models/File";

class OrganizingController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const meetups = await Meetup.findAll({
      where: {
        user_id: req.userId,
        date: {
          [Op.gt]: new Date()
        }
      },
      include: [
        {
          model: File,
          as: "banner",
          attributes: ["id", "path", "url"]
        }
      ],
      limit: 5,
      offset: (page - 1) * 5
    });

    let pages = await Meetup.count({ where: { user_id: req.userId } });

    pages = Math.ceil(pages / 5);

    return res.json({ meetups: [...meetups], pages: pages });
  }
}

export default new OrganizingController();
